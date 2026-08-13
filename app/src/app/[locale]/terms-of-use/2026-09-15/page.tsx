import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { getTermsDocument } from "@/lib/legal/terms-versions";

interface LegalRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

const document = getTermsDocument("2026-09-15");

export const metadata: Metadata = {
  title: `${document.title} | Capsule Zero`,
  description: document.summary,
};

export default async function FutureTermsOfUseRoute({
  params,
}: LegalRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPage document={document} />;
}
