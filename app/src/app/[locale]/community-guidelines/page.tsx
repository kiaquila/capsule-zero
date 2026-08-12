import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { policyDocuments } from "@/lib/legal/policy-documents";

interface CommunityGuidelinesRouteProps {
  params: Promise<{ locale: string }>;
}

const document = policyDocuments["community-guidelines"];

export const metadata: Metadata = {
  title: `${document.title} | Capsule Zero`,
  description: document.summary,
};

export default async function CommunityGuidelinesRoute({
  params,
}: CommunityGuidelinesRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={document} />;
}
