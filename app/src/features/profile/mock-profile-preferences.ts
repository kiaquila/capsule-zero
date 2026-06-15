import "server-only";

import { cookies } from "next/headers";

const MOCK_PROFILE_COOKIE = "capsule_zero_mock_profile";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface MockProfilePreferences {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  city: string;
  shoeSize: string;
  topSize: string;
  bottomSize: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  googleAuthenticator: boolean;
  pushSecondFactor: boolean;
  updatedAt: string;
}

export type MockProfilePreferenceInput = Omit<
  MockProfilePreferences,
  "updatedAt" | "userId"
>;

export async function readMockProfilePreferences(
  userId: string,
): Promise<MockProfilePreferences | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(MOCK_PROFILE_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(rawValue),
    ) as MockProfilePreferences;

    if (parsed.userId !== userId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function persistMockProfilePreferences(
  userId: string,
  input: MockProfilePreferenceInput,
) {
  const cookieStore = await cookies();
  const value: MockProfilePreferences = {
    ...input,
    userId,
    updatedAt: new Date().toISOString(),
  };

  cookieStore.set(
    MOCK_PROFILE_COOKIE,
    encodeURIComponent(JSON.stringify(value)),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  );

  return value;
}
