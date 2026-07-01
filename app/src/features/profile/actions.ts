"use server";

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
  usernameLength: "Use 3-30 characters.",
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

  await registry.profiles.updateProfile(session.userId, {
    city: data.city || undefined,
    country: data.country || undefined,
    displayName,
  });

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
