import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { FavoritesShell } from "@/components/favorites/FavoritesShell";
import { buildFavoritesSnapshot } from "@/components/favorites/favorites-data";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";
import type { AppLocale } from "@/i18n/routing";
import { createProviderRegistry } from "@/lib/providers";

interface FavoritesRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function FavoritesRoute({ params }: FavoritesRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const registry = createProviderRegistry();
  const snapshot = await buildFavoritesSnapshot({
    registry,
    session,
    locale: locale as AppLocale,
  });

  return (
    <AuthenticatedTermsNotice>
      <FavoritesShell snapshot={snapshot} />
    </AuthenticatedTermsNotice>
  );
}
