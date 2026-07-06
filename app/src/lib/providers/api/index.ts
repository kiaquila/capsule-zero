import "server-only";

import { headers as requestHeaders } from "next/headers";
import type { Capsule, User } from "@/types";
import { readSignedAppSession } from "@/features/auth/session";
import { createMockProviderRegistry } from "../mock";
import { MOCK_USER } from "../mock/fixtures";
import type {
  AuthPort,
  CapsuleRepository,
  PasswordCredentials,
  Profile,
  ProfileRepository,
  ProfileUpdate,
  ProviderHealth,
  ProviderRegistry,
  Session,
  WardrobeEntry,
  WardrobeRepository,
} from "../contracts";

// The `api` provider talks to the Go modular monolith (auth/profile bounded
// context) behind nginx. It is the real backend the redirect set up; the
// domains that have not moved off the Supabase provider yet (wardrobe, capsule,
// catalog, billing) are served from the mock fixtures so the app stays
// navigable. Each migrated slice replaces one of those with a real `api` port.

interface AuthResponse {
  session?: { token: string; expiresAt: string };
  user?: User;
  profile?: Profile;
  requiresEmailConfirmation?: boolean;
  verificationFlowId?: string;
}

interface ApiError extends Error {
  details?: Record<string, unknown>;
}

function apiBaseUrl(): string {
  return process.env.CAPSULE_API_BASE_URL ?? "http://api:8080";
}

async function sessionToken(): Promise<string | null> {
  const persisted = await readSignedAppSession();
  return persisted?.accessToken ?? null;
}

// Forward the originating client's address to the Go API so the auth rate limit
// buckets per real user, not per web container (server actions call the API over
// the private network, where the API would otherwise see only the web address).
//
// The address is taken ONLY from `X-Real-IP`, which our own edge nginx sets to
// `$remote_addr` and overwrites on every request. With the nginx realip module
// (see infra/nginx*) `$remote_addr` is the true client even behind Cloudflare —
// nginx trusts `CF-Connecting-IP` only for connections from a Cloudflare range,
// so a direct-to-origin forgery is ignored. We deliberately do NOT read
// `CF-Connecting-IP` (or the raw, client-appendable `X-Forwarded-For`) here:
// the web `location /` does not sanitize those, so trusting them would let a
// caller rotate the header to mint a fresh rate-limit bucket per attempt. The
// value is passed under the dedicated `X-Capsule-Client-IP` header the API trusts.
async function trustedClientIp(): Promise<string | undefined> {
  try {
    const incoming = await requestHeaders();
    return incoming.get("x-real-ip") ?? undefined;
  } catch {
    // Called outside a request scope (no inbound headers to forward).
    return undefined;
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<{ status: number; data: T }> {
  const { token, headers, ...rest } = init;
  const clientIp = await trustedClientIp();
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(clientIp ? { "X-Capsule-Client-IP": clientIp } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  let data: T;
  try {
    data = (text ? JSON.parse(text) : {}) as T;
  } catch {
    // Non-JSON upstream body (e.g. an nginx 502 HTML page while the API is
    // down) must fall through to the caller's status-based error handling
    // instead of throwing a SyntaxError out of the provider.
    data = {} as T;
  }
  return { status: response.status, data };
}

function errorCode(data: unknown): string | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { code?: unknown } }).error;
    if (error && typeof error.code === "string" && error.code.trim()) {
      return error.code;
    }
  }
  return undefined;
}

function errorDetails(data: unknown): Record<string, unknown> | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { details?: unknown } }).error;
    if (error && isRecord(error.details)) {
      return error.details;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

// providerError carries the API's machine code as the message prefix so the
// server actions can hand the UI a localizable code (spec 035).
function providerError(
  data: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): Error {
  const code = errorCode(data) ?? fallbackCode;
  const error = new Error(`${code}: ${errorMessage(data, fallbackMessage)}`) as ApiError;
  error.details = errorDetails(data);
  return error;
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: unknown } }).error;
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

function mapSession(payload: AuthResponse): Session {
  if (!payload.session || !payload.user) {
    throw new Error("AUTH_FAILED: the API did not return a session.");
  }
  return {
    user: payload.user,
    accessToken: payload.session.token,
    expiresAt: payload.session.expiresAt,
    verificationFlowId: payload.verificationFlowId,
  };
}

function buildAuthPort(): AuthPort {
  return {
    async getCurrentSession() {
      const token = await sessionToken();
      if (!token) {
        return null;
      }
      const { status, data } = await apiFetch<AuthResponse>("/api/auth/whoami", {
        method: "GET",
        token,
      });
      if (status >= 400) {
        throw providerError(
          data,
          "INTERNAL_ERROR",
          "Session check is temporarily unavailable.",
        );
      }
      return data.session && data.user ? mapSession(data) : null;
    },

    async signUpWithPassword(credentials: PasswordCredentials) {
      const { status, data } = await apiFetch<AuthResponse>(
        "/api/auth/registration",
        {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            name: credentials.name,
            locale: credentials.locale,
          }),
        },
      );
      if (status >= 400) {
        throw providerError(data, "VALIDATION_ERROR", "Registration failed.");
      }
      if (data.requiresEmailConfirmation || !data.session) {
        return null;
      }
      return mapSession(data);
    },

    async signInWithPassword(credentials: PasswordCredentials) {
      const { status, data } = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      if (status >= 400) {
        throw providerError(
          data,
          "UNAUTHENTICATED",
          "Invalid email or password",
        );
      }
      return mapSession(data);
    },

    async requestPasswordRecovery(email: string) {
      const { status, data } = await apiFetch<{ flowId?: string }>(
        "/api/auth/recovery",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
      if (status >= 400 || !data.flowId) {
        throw providerError(
          data,
          "INTERNAL_ERROR",
          "Password recovery is temporarily unavailable.",
        );
      }
      return { delivery: "email" as const, email, flowId: data.flowId };
    },

    async completePasswordRecovery(completion) {
      const { status, data } = await apiFetch<AuthResponse>(
        "/api/auth/recovery/complete",
        {
          method: "POST",
          body: JSON.stringify(completion),
        },
      );
      if (status >= 400) {
        throw providerError(
          data,
          "INVALID_CODE",
          "The recovery code is invalid or has expired.",
        );
      }
      return mapSession(data);
    },

    async startEmailVerification(email: string) {
      const { status, data } = await apiFetch<{ flowId?: string }>(
        "/api/auth/verification",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
      if (status >= 400 || !data.flowId) {
        throw providerError(
          data,
          "INTERNAL_ERROR",
          "Email verification is temporarily unavailable.",
        );
      }
      return { delivery: "email" as const, email, flowId: data.flowId };
    },

    async completeEmailVerification(completion) {
      const { status, data } = await apiFetch<Record<string, unknown>>(
        "/api/auth/verification/complete",
        {
          method: "POST",
          body: JSON.stringify(completion),
        },
      );
      if (status >= 400) {
        throw providerError(
          data,
          "INVALID_CODE",
          "The verification code is invalid or has expired.",
        );
      }
    },

    async changePassword(change) {
      const token = await sessionToken();
      const { status, data } = await apiFetch<Record<string, unknown>>(
        "/api/auth/password",
        {
          method: "POST",
          token,
          body: JSON.stringify(change),
        },
      );
      if (status >= 400) {
        throw providerError(
          data,
          "INTERNAL_ERROR",
          "Password change is temporarily unavailable.",
        );
      }
    },

    async signOut() {
      const token = await sessionToken();
      if (!token) {
        return;
      }
      const { status, data } = await apiFetch<Record<string, unknown>>(
        "/api/auth/logout",
        { method: "POST", token },
      );
      if (status >= 400) {
        throw new Error(
          `SIGN_OUT_FAILED: ${errorMessage(
            data,
            "Sign out is temporarily unavailable.",
          )}`,
        );
      }
    },
  };
}

function buildProfileRepository(): ProfileRepository {
  return {
    async getProfile(userId: string) {
      // The session token identifies the user; userId is part of the contract
      // signature but the API resolves the profile from the session.
      void userId;
      const token = await sessionToken();
      const { status, data } = await apiFetch<Profile>("/api/profile", {
        method: "GET",
        token,
      });
      if (status >= 400) {
        throw new Error("PROFILE_NOT_FOUND: profile could not be loaded.");
      }
      return data;
    },

    async updateProfile(userId: string, input: ProfileUpdate) {
      void userId;
      const token = await sessionToken();
      const { status, data } = await apiFetch<Profile>("/api/profile", {
        method: "PATCH",
        token,
        body: JSON.stringify(input),
      });
      if (status >= 400) {
        throw new Error("PROFILE_UPDATE_FAILED: profile could not be updated.");
      }
      return data;
    },
  };
}

function rebindWardrobeItem(
  item: WardrobeEntry,
  userId: string,
): WardrobeEntry {
  return { ...item, userId };
}

function rebindCapsule(capsule: Capsule, userId: string): Capsule {
  return { ...capsule, userId };
}

function buildFixtureBackedWardrobe(
  base: WardrobeRepository,
): WardrobeRepository {
  return {
    async listItems(userId, filters) {
      const ownedItems = await base.listItems(userId, filters);
      if (ownedItems.length > 0) {
        return ownedItems;
      }
      const fixtureItems = await base.listItems(MOCK_USER.id, filters);
      return fixtureItems.map((item) => rebindWardrobeItem(item, userId));
    },

    async getItem(userId, itemId) {
      const ownedItem = await base.getItem(userId, itemId);
      if (ownedItem) {
        return ownedItem;
      }
      const fixtureItem = await base.getItem(MOCK_USER.id, itemId);
      return fixtureItem ? rebindWardrobeItem(fixtureItem, userId) : null;
    },

    async createItem(userId, draft) {
      return base.createItem(userId, draft);
    },

    async updateItemStatus(userId, itemId, status) {
      try {
        return await base.updateItemStatus(userId, itemId, status);
      } catch (error) {
        const fixtureItem = await base.getItem(MOCK_USER.id, itemId);
        if (!fixtureItem) {
          throw error;
        }
        const updated = await base.updateItemStatus(
          MOCK_USER.id,
          itemId,
          status,
        );
        return rebindWardrobeItem(updated, userId);
      }
    },

    async setFavorite(userId, itemId, favorite) {
      try {
        return await base.setFavorite(userId, itemId, favorite);
      } catch (error) {
        const fixtureItem = await base.getItem(MOCK_USER.id, itemId);
        if (!fixtureItem) {
          throw error;
        }
        const updated = await base.setFavorite(
          MOCK_USER.id,
          itemId,
          favorite,
        );
        return rebindWardrobeItem(updated, userId);
      }
    },
  };
}

function buildFixtureBackedCapsules(base: CapsuleRepository): CapsuleRepository {
  return {
    async getCurrentCapsule(userId) {
      const ownedCapsule = await base.getCurrentCapsule(userId);
      if (ownedCapsule) {
        return ownedCapsule;
      }
      const fixtureCapsule = await base.getCurrentCapsule(MOCK_USER.id);
      return fixtureCapsule ? rebindCapsule(fixtureCapsule, userId) : null;
    },

    async createCapsule(userId, draft) {
      return base.createCapsule(userId, draft);
    },
  };
}

async function apiHealth(): Promise<ProviderHealth> {
  try {
    const { data } = await apiFetch<Record<string, unknown>>("/api/health", {
      method: "GET",
    });
    const ok = data.ok === true;
    return {
      status: ok ? "ok" : "degraded",
      mode: "api",
      fixtures: { users: 0, wardrobeItems: 0, catalogItems: 0, coinPacks: 0 },
      integrations: {
        postgres: data.postgres === "ok" ? "configured" : "pending-gate",
        kratos: data.kratos === "ok" ? "configured" : "pending-gate",
      },
    };
  } catch {
    return {
      status: "degraded",
      mode: "api",
      fixtures: { users: 0, wardrobeItems: 0, catalogItems: 0, coinPacks: 0 },
      integrations: { postgres: "pending-gate", kratos: "pending-gate" },
    };
  }
}

// createApiProviderRegistry wires the real auth/profile ports over the Go API
// and inherits the not-yet-migrated domains from the mock registry until each
// is replaced by its own `api` slice.
export function createApiProviderRegistry(): ProviderRegistry {
  const base = createMockProviderRegistry();
  return {
    ...base,
    mode: "api",
    auth: buildAuthPort(),
    profiles: buildProfileRepository(),
    wardrobe: buildFixtureBackedWardrobe(base.wardrobe),
    capsules: buildFixtureBackedCapsules(base.capsules),
    health: apiHealth,
  };
}
