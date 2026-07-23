import type { PersistedMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry } from "@/lib/providers";
import type { DashboardSnapshot } from "@/components/dashboard/dashboard-data";
import { buildDashboardSnapshot } from "@/components/dashboard/dashboard-data";
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
    sessions: Array<{
      id: string;
      device: string;
      location: string;
      lastSeen: string;
      current?: boolean;
      type: "desktop" | "mobile" | "tablet";
    }>;
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

const DEFAULT_DATE_OF_BIRTH = "1992-06-15";
const DEFAULT_PHONE = "";
const DEFAULT_SHOE_SIZE = "37";
const DEFAULT_TOP_SIZE = "S";
const DEFAULT_BOTTOM_SIZE = "S";

export async function buildProfileSnapshot({
  registry,
  session,
  locale,
}: BuildProfileSnapshotOptions): Promise<ProfileSnapshot> {
  const [dashboardSnapshot, providerProfile, savedPreferences] =
    await Promise.all([
      buildDashboardSnapshot({ registry, session, locale }),
      registry.profiles.getProfile(session.userId),
      readMockProfilePreferences(session.userId),
    ]);
  const fallbackNames = splitDisplayName(
    session.name ?? providerProfile.displayName,
    session.email ?? providerProfile.email,
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
      phone: savedPreferences?.phone ?? DEFAULT_PHONE,
      dateOfBirth: savedPreferences?.dateOfBirth ?? DEFAULT_DATE_OF_BIRTH,
      country: savedPreferences?.country ?? providerProfile.country ?? "AR",
      city: savedPreferences?.city ?? providerProfile.city ?? "Buenos Aires",
      shoeSize: savedPreferences?.shoeSize ?? DEFAULT_SHOE_SIZE,
      topSize: savedPreferences?.topSize ?? DEFAULT_TOP_SIZE,
      bottomSize: savedPreferences?.bottomSize ?? DEFAULT_BOTTOM_SIZE,
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
      sessions: [
        {
          id: "macbook-chrome",
          device: "MacBook Pro - Chrome",
          location: "Buenos Aires, AR",
          lastSeen: "2 min ago",
          current: true,
          type: "desktop",
        },
        {
          id: "iphone-app",
          device: "iPhone 15 Pro - Capsule Zero App",
          location: "Buenos Aires, AR",
          lastSeen: "3 hours ago",
          type: "mobile",
        },
        {
          id: "ipad-safari",
          device: "iPad Air - Safari",
          location: "Buenos Aires, AR",
          lastSeen: "2 days ago",
          type: "tablet",
        },
      ],
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

// A credentials-only sign-up (spec 048) carries no name — start from the email
// local-part rather than presenting a fabricated identity; empty strings are
// the honest floor (initials and username already fall back to the email).
function splitDisplayName(displayName: string | undefined, email: string) {
  const source = displayName?.trim() || (email.split("@")[0] ?? "");
  const parts = source.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
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
