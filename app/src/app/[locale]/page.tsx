import { setRequestLocale } from "next-intl/server";
import { LandingPage } from "@/components/landing/LandingPage";
import { googleSignInAvailable } from "@/features/auth/google";

interface LandingRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LandingRoute({ params }: LandingRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage googleSignIn={await googleSignInAvailable()} />;
}
