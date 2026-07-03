import { setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/auth/AuthPage";

interface AuthRouteProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    flow?: string;
    code?: string;
  }>;
}

export default async function AuthRoute({
  params,
  searchParams,
}: AuthRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // An emailed recovery link (or a Kratos recovery-UI redirect) lands here
  // with the flow id — open the completion step directly (spec 035).
  const { flow, code } = await searchParams;

  return <AuthPage recovery={flow ? { flowId: flow, code } : undefined} />;
}
