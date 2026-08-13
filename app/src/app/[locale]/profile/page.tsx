import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { buildProfileSnapshot } from "@/components/profile/profile-data";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface ProfileRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ProfileRoute({ params }: ProfileRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildProfileSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return (
    <AuthenticatedTermsNotice>
      <ProfileShell snapshot={snapshot} />
    </AuthenticatedTermsNotice>
  );
}
