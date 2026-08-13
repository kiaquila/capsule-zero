import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { getApplicableTermsDocument } from "@/lib/legal/terms-versions";

interface LegalRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: LegalRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const document = getApplicableTermsDocument(locale);

  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function TermsOfUseRoute({ params }: LegalRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={getApplicableTermsDocument(locale)} />;
}
