import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { getPolicyDocument } from "@/lib/legal/policy-documents";

interface CopyrightPolicyRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CopyrightPolicyRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const document = getPolicyDocument("copyright-policy", locale);
  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function CopyrightPolicyRoute({
  params,
}: CopyrightPolicyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPage document={getPolicyDocument("copyright-policy", locale)} />
  );
}
