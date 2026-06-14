"use server";

import { z } from "zod";
import { readMockSession } from "@/features/auth/session";
import { createProviderRegistry } from "@/lib/providers";
import {
  persistMockProfilePreferences,
  type MockProfilePreferenceInput,
} from "./mock-profile-preferences";

const optionalText = z.string().trim().max(80);

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  lastName: z.string().trim().min(1).max(40),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(40),
  dateOfBirth: z.string().trim().max(20),
  country: optionalText,
  city: optionalText,
  shoeSize: z.string().trim().max(8),
  topSize: z.string().trim().max(8),
  bottomSize: z.string().trim().max(8),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  preferredLoginMethod: z.enum(["email", "sms"]),
  googleAuthenticator: z.boolean(),
  pushSecondFactor: z.boolean(),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;

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
  const reservedUsernames = new Set(["admin", "api", "root", "support", "capsule_zero"]);

  return !takenUsernames.has(username) && !reservedUsernames.has(username);
}

function buildInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "CZ";
}
