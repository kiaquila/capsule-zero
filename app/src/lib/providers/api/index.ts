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
}

function apiBaseUrl(): string {
  return process.env.CAPSULE_API_BASE_URL ?? "http://api:8080";
}

async function sessionToken(): Promise<string | null> {
  const persisted = await readSignedAppSession();
  return persisted?.accessToken ?? null;
}

// Forward the originating client's address to the Go API. Server actions call
// the API over the private compose network, so without this the API would see
// only the web container's address and the auth rate limit would bucket every
// user together. The host-nginx edge sets X-Forwarded-For / X-Real-IP on the
// inbound web request; we pass it through so the API throttles per real client.
async function clientForwardedFor(): Promise<string | undefined> {
  try {
    const incoming = await requestHeaders();
    return (
      incoming.get("x-forwarded-for") ??
      incoming.get("x-real-ip") ??
      undefined
    );
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
  const forwardedFor = await clientForwardedFor();
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const data = (text ? JSON.parse(text) : {}) as T;
  return { status: response.status, data };
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
        throw new Error(
          `SESSION_CHECK_FAILED: ${errorMessage(
            data,
            "Session check is temporarily unavailable.",
          )}`,
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
        throw new Error(
          `REGISTRATION_FAILED: ${errorMessage(data, "Registration failed.")}`,
        );
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
        throw new Error(
          `SIGN_IN_FAILED: ${errorMessage(data, "Invalid email or password")}`,
        );
      }
      return mapSession(data);
    },

    async requestPasswordRecovery(email: string) {
      const { status, data } = await apiFetch<Record<string, unknown>>(
        "/api/auth/recovery",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
      if (status >= 400) {
        throw new Error(
          `RECOVERY_FAILED: ${errorMessage(
            data,
            "Password recovery is temporarily unavailable.",
          )}`,
        );
      }
      return { delivery: "email", email };
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
