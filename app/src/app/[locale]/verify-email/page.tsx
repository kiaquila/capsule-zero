import { redirect } from "next/navigation";
import { createProviderRegistry } from "@/lib/providers";

interface VerifyEmailRouteProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    flow?: string;
    code?: string;
  }>;
}

// Silent landing for emailed verification links (spec 035 review round 2).
// The emailed link goes through Kratos's public GET endpoint, which consumes
// the code and verifies the address BEFORE redirecting here — so there is
// nothing for the user to do and no UI to show. When a link carries the code
// directly (?flow=…&code=…), complete it server-side as a best effort. Either
// way the user lands on the dashboard (which itself bounces signed-out
// visitors to /auth); the verify-email banner reflects the live state.
export default async function VerifyEmailRoute({
  params,
  searchParams,
}: VerifyEmailRouteProps) {
  const { locale } = await params;
  const { flow, code } = await searchParams;

  if (flow && code) {
    try {
      await createProviderRegistry().auth.completeEmailVerification({
        flowId: flow,
        code,
      });
    } catch {
      // Already-used or expired codes are indistinguishable from a repeat
      // click; the dashboard banner shows the truth either way.
    }
  }

  redirect(`/${locale}/dashboard`);
}
