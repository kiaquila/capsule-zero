import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { readMockSession } from "@/features/auth/session";

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

  return <DashboardShell email={session.email} />;
}
