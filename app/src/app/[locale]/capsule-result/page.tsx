import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { CapsuleResultShell } from "@/components/capsule-result/CapsuleResultShell";
import { buildCapsuleResultSnapshot } from "@/components/capsule-result/capsule-result-data";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface CapsuleResultRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CapsuleResultRoute({
  params,
}: CapsuleResultRouteProps) {
  const { locale } = await params;
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

  return <CapsuleResultShell snapshot={snapshot} />;
}
