import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { getPolicyDocument } from "@/lib/legal/policy-documents";

interface EnforcementPolicyRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: EnforcementPolicyRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const document = getPolicyDocument("enforcement-policy", locale);
  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function EnforcementPolicyRoute({
  params,
}: EnforcementPolicyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPage document={getPolicyDocument("enforcement-policy", locale)} />
  );
}
