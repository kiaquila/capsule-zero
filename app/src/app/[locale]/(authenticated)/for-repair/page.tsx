import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ForRepairShell } from "@/components/for-repair/ForRepairShell";
import { buildForRepairSnapshot } from "@/components/for-repair/for-repair-data";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface ForRepairRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ForRepairRoute({ params }: ForRepairRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildForRepairSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return <ForRepairShell snapshot={snapshot} />;
}
