import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AuthenticatedTermsNotice } from "@/components/legal/AuthenticatedTermsNotice";
import { readMockSession } from "@/features/auth/session";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AuthenticatedLayout({
  children,
  params,
}: AuthenticatedLayoutProps) {
  const { locale } = await params;
  const session = await readMockSession();

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  return <AuthenticatedTermsNotice>{children}</AuthenticatedTermsNotice>;
}
