import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { CapsuleResultShell } from "@/components/capsule-result/CapsuleResultShell";
import { buildCapsuleResultSnapshot } from "@/components/capsule-result/capsule-result-data";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface CapsuleRouteProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function CapsuleRoute({ params }: CapsuleRouteProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildCapsuleResultSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  if (!snapshot.capsule) {
    notFound();
  }

  if (id !== snapshot.capsule.id && id !== "mock-active") {
    notFound();
  }

  return (
    <AuthenticatedTermsNotice>
      <CapsuleResultShell snapshot={snapshot} />
    </AuthenticatedTermsNotice>
  );
}
