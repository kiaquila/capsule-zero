import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { MyItemsShell } from "@/components/my-items/MyItemsShell";
import { buildMyItemsSnapshot } from "@/components/my-items/my-items-data";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface MyItemsRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function MyItemsRoute({ params }: MyItemsRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildMyItemsSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return (
    <AuthenticatedTermsNotice>
      <MyItemsShell snapshot={snapshot} />
    </AuthenticatedTermsNotice>
  );
}
