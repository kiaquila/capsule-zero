import { setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/auth/AuthPage";

interface AuthRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AuthRoute({ params }: AuthRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage />;
}
