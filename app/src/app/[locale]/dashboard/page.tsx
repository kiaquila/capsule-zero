import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { buildDashboardSnapshot } from "@/components/dashboard/dashboard-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface DashboardRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildDashboardSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return <DashboardShell snapshot={snapshot} />;
}
