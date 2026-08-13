import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { getPolicyDocument } from "@/lib/legal/policy-documents";

interface CommunityGuidelinesRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CommunityGuidelinesRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const document = getPolicyDocument("community-guidelines", locale);
  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function CommunityGuidelinesRoute({
  params,
}: CommunityGuidelinesRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPage document={getPolicyDocument("community-guidelines", locale)} />
  );
}
