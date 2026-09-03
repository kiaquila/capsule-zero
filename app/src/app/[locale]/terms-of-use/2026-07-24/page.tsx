import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalContacts } from "@/lib/legal/contacts";
import { getArchivedTermsDocument } from "@/lib/legal/terms-versions";

interface LegalRouteProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const document = getArchivedTermsDocument();

  return {
    title: `${document.title} | Capsule Zero`,
    description: document.summary,
  };
}

export default async function ArchivedTermsOfUseRoute({
  params,
}: LegalRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPage
      archiveContactEmail={legalContacts.legalEmail}
      document={getArchivedTermsDocument()}
      renderIntro={false}
    />
  );
}
