import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { policyDocuments } from "@/lib/legal/policy-documents";

interface EnforcementPolicyRouteProps {
  params: Promise<{ locale: string }>;
}

const document = policyDocuments["enforcement-policy"];

export const metadata: Metadata = {
  title: `${document.title} | Capsule Zero`,
  description: document.summary,
};

export default async function EnforcementPolicyRoute({
  params,
}: EnforcementPolicyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={document} />;
}
