"use server";

import { z } from "zod";
import { authActionFailure } from "@/features/auth/error-codes";
import { readMockSession } from "@/features/auth/session";
import { createProviderRegistry } from "@/lib/providers";
import {
  persistMockProfilePreferences,
  type MockProfilePreferenceInput,
} from "./mock-profile-preferences";
import {
  createProfileFormSchema,
  type ProfileFormInput,
  type ProfileValidationMessages,
} from "./schemas";

const serverValidationMessages: ProfileValidationMessages = {
  firstName: "Enter your first name.",
  lastName: "Enter your last name.",
  nameLength: "Keep names under 40 characters.",
  displayNameLength: "Keep the combined name under 80 characters.",
  usernameLength: "Username must be 3–30 characters.",
  usernamePattern: "Use lowercase letters, numbers, and underscores only.",
  email: "Enter a valid email.",
  phoneLength: "Keep the phone number under 40 characters.",
  date: "Enter a valid date.",
  cityLength: "Keep the city under 80 characters.",
};

const profileFormSchema = createProfileFormSchema(serverValidationMessages);

export interface ProfileActionResult {
  ok: boolean;
  message?: string;
  profile?: MockProfilePreferenceInput & {
    displayName: string;
    initials: string;
    updatedAt: string;
  };
}

export async function saveProfileAction(
  input: ProfileFormInput,
): Promise<ProfileActionResult> {
  const session = await readMockSession();

  if (!session) {
    return { ok: false, message: "SESSION_REQUIRED" };
  }

  const parsed = profileFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "VALIDATION_ERROR" };
  }

  const data = parsed.data;

  if (!(await isUsernameAvailableStub(data.username, session.userId))) {
    return { ok: false, message: "USERNAME_TAKEN" };
  }

  const displayName = `${data.firstName} ${data.lastName}`.trim();
  const registry = createProviderRegistry();

  try {
    await registry.profiles.updateProfile(session.userId, {
      city: data.city,
      country: data.country,
      displayName,
    });
  } catch (error) {
    // Surface provider rejections (e.g. an API 400/5xx) through the form's
    // save-error path instead of an unhandled server-action error.
    console.error("Profile save failed:", error);
    return { ok: false, message: "PROFILE_SAVE_FAILED" };
  }

  const persisted = await persistMockProfilePreferences(session.userId, data);

  return {
    ok: true,
    profile: {
      ...data,
      displayName,
      initials: buildInitials(displayName || data.email),
      updatedAt: persisted.updatedAt,
    },
  };
}

async function isUsernameAvailableStub(username: string, userId: string) {
  void userId;

  const takenUsernames = new Set(["taken", "stylefounder", "capsuleuser"]);
  const reservedUsernames = new Set([
    "admin",
    "api",
    "root",
    "support",
    "capsule_zero",
  ]);

  return !takenUsernames.has(username) && !reservedUsernames.has(username);
}

function buildInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "CZ"
  );
}

/** null explicitly means all others; malformed/missing IDs never mean bulk. */
export async function revokeSessionAction(
  id: string | null,
): Promise<{ ok: boolean; code?: string }> {
  if (id !== null && !z.string().uuid().safeParse(id).success) {
    return { ok: false, code: "VALIDATION_ERROR" };
  }
  const { auth } = createProviderRegistry();
  if (!auth.revokeSession || !auth.revokeOtherSessions)
    return { ok: false, code: "UNAVAILABLE" };
  try {
    if (id === null) await auth.revokeOtherSessions();
    else await auth.revokeSession(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: authActionFailure(error).code };
  }
}
