import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

const FUTURE_DASHBOARD_ROUTES = new Set([
  "profile",
]);

interface FutureDashboardRouteProps {
  params: Promise<{
    future: string;
    locale: string;
  }>;
}

export default async function FutureDashboardRoute({
  params,
}: FutureDashboardRouteProps) {
  const { future, locale } = await params;
  setRequestLocale(locale);

  if (!FUTURE_DASHBOARD_ROUTES.has(future)) {
    notFound();
  }

  redirect(`/${locale}/dashboard`);
}
