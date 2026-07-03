import { setRequestLocale } from "next-intl/server";
import { VerifyEmailPage } from "@/components/auth/VerifyEmailPage";

interface VerifyEmailRouteProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    flow?: string;
    code?: string;
  }>;
}

// Landing for emailed verification links (spec 035): Kratos's verification UI
// URL points here with the flow id (and code when the template carries one).
export default async function VerifyEmailRoute({
  params,
  searchParams,
}: VerifyEmailRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { flow, code } = await searchParams;

  return <VerifyEmailPage code={code} flowId={flow} />;
}
