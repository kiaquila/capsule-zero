import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { AccountSession, ProviderRegistry } from "@/lib/providers";
import type { DashboardSnapshot } from "@/components/dashboard/dashboard-data";
import { buildDashboardSnapshot } from "@/components/dashboard/dashboard-data";
import { splitDisplayName } from "@/features/profile/display-name";
import { readMockProfilePreferences } from "@/features/profile/mock-profile-preferences";

export interface ProfileSnapshot {
  profile: {
    userId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    initials: string;
    phone: string;
    dateOfBirth: string;
    country: string;
    city: string;
    shoeSize: string;
    topSize: string;
    bottomSize: string;
    avatarUrl?: string;
    coinBalance: number;
  };
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    googleAuthenticator: boolean;
    pushSecondFactor: boolean;
  };
  account: {
    userIdLabel: string;
    sessions: AccountSession[];
    sessionsStatus: "available" | "unavailable";
  };
  navigation: DashboardSnapshot["navigation"];
  options: {
    countries: Array<{ value: string; label: string }>;
    shoeSizes: string[];
    clothingSizes: string[];
  };
}

interface BuildProfileSnapshotOptions {
  registry: ProviderRegistry;
  session: PersistedMockSession;
  locale: AppLocale;
}

export async function buildProfileSnapshot({
  registry,
  session,
  locale,
}: BuildProfileSnapshotOptions): Promise<ProfileSnapshot> {
  const [dashboardSnapshot, providerProfile, savedPreferences, inventory] =
    await Promise.all([
      buildDashboardSnapshot({ registry, session, locale }),
      registry.profiles.getProfile(session.userId),
      readMockProfilePreferences(session.userId),
      registry.auth.listSessions
        ? registry.auth.listSessions().then(
            (sessions) => ({ sessions, sessionsStatus: "available" as const }),
            () => ({ sessions: [], sessionsStatus: "unavailable" as const }),
          )
        : Promise.resolve({
            sessions: [],
            sessionsStatus: "unavailable" as const,
          }),
    ]);
  const fallbackNames = splitDisplayName(
    session.email ?? providerProfile.email,
    session.name,
    providerProfile.displayName,
  );
  const names = {
    firstName: savedPreferences?.firstName ?? fallbackNames.firstName,
    lastName: savedPreferences?.lastName ?? fallbackNames.lastName,
  };
  const email =
    savedPreferences?.email ?? session.email ?? providerProfile.email;
  const displayName = `${names.firstName} ${names.lastName}`.trim();
  const username =
    savedPreferences?.username ?? buildDefaultUsername(email, displayName);

  return {
    profile: {
      userId: session.userId,
      displayName,
      firstName: names.firstName,
      lastName: names.lastName,
      username,
      email,
      initials: buildInitials(displayName || email),
      phone: savedPreferences?.phone ?? "",
      dateOfBirth: savedPreferences?.dateOfBirth ?? "",
      country: savedPreferences?.country ?? providerProfile.country ?? "",
      city: savedPreferences?.city ?? providerProfile.city ?? "",
      shoeSize: savedPreferences?.shoeSize ?? "",
      topSize: savedPreferences?.topSize ?? "",
      bottomSize: savedPreferences?.bottomSize ?? "",
      avatarUrl: providerProfile.avatarUrl,
      coinBalance: providerProfile.coinBalance,
    },
    preferences: {
      emailNotifications: savedPreferences?.emailNotifications ?? true,
      pushNotifications: savedPreferences?.pushNotifications ?? false,
      googleAuthenticator: savedPreferences?.googleAuthenticator ?? false,
      pushSecondFactor: savedPreferences?.pushSecondFactor ?? false,
    },
    account: {
      userIdLabel: buildUserIdLabel(session.userId),
      ...inventory,
    },
    navigation: dashboardSnapshot.navigation,
    options: {
      countries: [
        { value: "", label: "Select country" },
        { value: "AR", label: "Argentina" },
        { value: "BR", label: "Brazil" },
        { value: "CL", label: "Chile" },
        { value: "CO", label: "Colombia" },
        { value: "DE", label: "Germany" },
        { value: "FR", label: "France" },
        { value: "IT", label: "Italy" },
        { value: "MX", label: "Mexico" },
        { value: "RU", label: "Russia" },
        { value: "US", label: "United States" },
        { value: "UY", label: "Uruguay" },
      ],
      shoeSizes: [
        "",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
      ],
      clothingSizes: ["", "XS", "S", "M", "L", "XL"],
    },
  };
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

function buildUserIdLabel(userId: string) {
  return `usr_${userId.replaceAll("-", "").slice(0, 10)}`;
}

function buildDefaultUsername(email: string, displayName: string) {
  const localPart = email.split("@")[0] ?? "";
  const candidate = (localPart || displayName)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return candidate.length >= 3 ? candidate : "capsule_user";
}
