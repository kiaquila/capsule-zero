import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { GuidedJourneyShell } from "@/components/guided-journey/GuidedJourneyShell";
import { buildGuidedJourneySnapshot } from "@/components/guided-journey/guided-journey-data";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface GuidedJourneyRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function GuidedJourneyRoute({
  params,
}: GuidedJourneyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildGuidedJourneySnapshot({
    registry,
    session: {
      userId: session.userId,
      email: session.email,
      name: session.name,
    },
    locale: locale as AppLocale,
  });

  return (
    <AuthenticatedTermsNotice>
      <GuidedJourneyShell snapshot={snapshot} />
    </AuthenticatedTermsNotice>
  );
}
