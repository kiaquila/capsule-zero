import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/lib/legal-content";

interface LegalRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

const document = legalDocuments["terms-of-use"];

export const metadata: Metadata = {
  title: `${document.title} | Capsule Zero`,
  description: document.summary,
};

export default async function TermsOfUseRoute({ params }: LegalRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={document} />;
}
