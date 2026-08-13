import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { UncapsulatedShell } from "@/components/uncapsulated/UncapsulatedShell";
import { buildUncapsulatedSnapshot } from "@/components/uncapsulated/uncapsulated-data";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface UncapsulatedRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function UncapsulatedRoute({
  params,
}: UncapsulatedRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildUncapsulatedSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return <UncapsulatedShell snapshot={snapshot} />;
}
