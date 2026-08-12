import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { policyDocuments } from "@/lib/legal/policy-documents";

interface CopyrightPolicyRouteProps {
  params: Promise<{ locale: string }>;
}

const document = policyDocuments["copyright-policy"];

export const metadata: Metadata = {
  title: `${document.title} | Capsule Zero`,
  description: document.summary,
};

export default async function CopyrightPolicyRoute({
  params,
}: CopyrightPolicyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={document} />;
}
