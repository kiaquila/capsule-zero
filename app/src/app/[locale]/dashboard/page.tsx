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

  // Verify-email banner (spec 035): the signed cookie carries the last known
  // verification state (kept current by the sign-up and verification actions);
  // a live whoami overrides it where the provider can report one. An identity
  // hiccup must not break the dashboard — the banner just stays hidden.
  let emailVerified = session.emailVerified;
  let verificationFlowId = session.verificationFlowId;
  try {
    const liveSession = await registry.auth.getCurrentSession();
    if (typeof liveSession?.user.emailVerified === "boolean") {
      emailVerified = liveSession.user.emailVerified;
    }
    verificationFlowId = liveSession?.verificationFlowId ?? verificationFlowId;
  } catch {
    // keep the persisted state
  }
  const verifyEmail =
    emailVerified === false
      ? { email: session.email, flowId: verificationFlowId }
      : undefined;

  return <DashboardShell snapshot={snapshot} verifyEmail={verifyEmail} />;
}
