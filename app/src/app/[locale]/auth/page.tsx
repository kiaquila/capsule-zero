import { setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/auth/AuthPage";
import { googleSignInAvailable } from "@/features/auth/google";

interface AuthRouteProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    guestSave?: string;
    guestTransferId?: string;
    flow?: string;
    code?: string;
    googleError?: string;
  }>;
}

export default async function AuthRoute({
  params,
  searchParams,
}: AuthRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // A Kratos recovery-UI redirect or legacy/manual URL can still land here
  // with the flow id — open the completion step directly (spec 035).
  const { flow, code, googleError, guestSave, guestTransferId } =
    await searchParams;

  return (
    <AuthPage
      guestSave={guestSave === "1"}
      guestTransferId={
        guestTransferId && /^[0-9a-f-]{36}$/i.test(guestTransferId)
          ? guestTransferId
          : undefined
      }
      googleError={googleError === "1"}
      googleSignIn={await googleSignInAvailable()}
      recovery={flow ? { flowId: flow, code } : undefined}
    />
  );
}
