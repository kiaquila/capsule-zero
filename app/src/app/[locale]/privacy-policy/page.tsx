import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/lib/legal-content";
import { currentPrivacyDocumentRu } from "@/lib/legal/privacy-current-ru";

interface LegalRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

function getPrivacyDocument(locale: string) {
  return locale === "ru"
    ? currentPrivacyDocumentRu
    : legalDocuments["privacy-policy"];
}

export async function generateMetadata({
  params,
}: LegalRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const document = getPrivacyDocument(locale);

  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function PrivacyPolicyRoute({ params }: LegalRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={getPrivacyDocument(locale)} />;
}
