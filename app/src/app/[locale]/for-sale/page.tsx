import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ForSaleShell } from "@/components/for-sale/ForSaleShell";
import { buildForSaleSnapshot } from "@/components/for-sale/for-sale-data";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface ForSaleRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ForSaleRoute({ params }: ForSaleRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildForSaleSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return <ForSaleShell snapshot={snapshot} />;
}
