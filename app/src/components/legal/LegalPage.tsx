import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  LegalBlock,
  LegalDocument,
  LegalDocumentSlug,
} from "@/lib/legal-content";

const legalNavigation: ReadonlyArray<{
  href: `/${LegalDocumentSlug}`;
  labelKey:
    | "terms"
    | "privacy"
    | "community"
    | "copyrightPolicy"
    | "enforcement";
  slug: LegalDocumentSlug;
}> = [
  { href: "/terms-of-use", labelKey: "terms", slug: "terms-of-use" },
  {
    href: "/privacy-policy",
    labelKey: "privacy",
    slug: "privacy-policy",
  },
  {
    href: "/community-guidelines",
    labelKey: "community",
    slug: "community-guidelines",
  },
  {
    href: "/copyright-policy",
    labelKey: "copyrightPolicy",
    slug: "copyright-policy",
  },
  {
    href: "/enforcement-policy",
    labelKey: "enforcement",
    slug: "enforcement-policy",
  },
];

interface LegalPageProps {
  archiveContactEmail?: string;
  archivedTermsHref?: "/terms-of-use/2026-07-24";
  document: LegalDocument;
  renderIntro?: boolean;
}

export function LegalPage({
  archiveContactEmail,
  archivedTermsHref,
  document,
  renderIntro = true,
}: LegalPageProps) {
  const t = useTranslations("landing");
  const legal = useTranslations("legalPage");

  return (
    <div className="cz-page legal-page" data-testid="legal-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <header className="landing-header legal-header">
        <Link className="landing-logo" href="/">
          Capsule Zero
        </Link>
        <nav className="legal-header-links" aria-label={t("legalDocuments")}>
          {legalNavigation.map((item) => (
            <Link
              className={document.slug === item.slug ? "legal-link-active" : ""}
              href={item.href}
              key={item.slug}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </header>

      <main className="legal-main">
        {archiveContactEmail ? (
          <aside className="legal-index dashboard-glass">
            <p>{legal("archiveNotice", { email: archiveContactEmail })}</p>
          </aside>
        ) : null}
        <section className="legal-index dashboard-glass">
          <p className="legal-eyebrow">{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <dl className="legal-meta">
            <div>
              <dt>{legal("lastUpdated")}</dt>
              <dd>{document.lastUpdated}</dd>
            </div>
            <div>
              <dt>{legal("status")}</dt>
              <dd>{document.effectiveDate}</dd>
            </div>
          </dl>
          <div className="legal-toc" aria-label={legal("contents")}>
            <p>{legal("contents")}</p>
            <nav>
              {document.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <article className="legal-article dashboard-glass">
          {renderIntro && document.intro.length > 0 ? (
            <section
              aria-label={legal("introduction")}
              className="legal-section legal-intro"
              data-testid="legal-intro"
            >
              {document.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}
          {document.sections.map((section) => (
            <section className="legal-section" id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <LegalBlockRenderer
                  block={block}
                  key={`${section.id}-${index}`}
                />
              ))}
            </section>
          ))}

          <footer className="legal-article-footer">
            {archivedTermsHref ? (
              <Link
                data-testid="legal-terms-archive"
                href={archivedTermsHref}
              >
                {legal("readArchivedTerms")}
              </Link>
            ) : null}
            <Link href={document.relatedDocument.href}>
              {legal("readRelated", {
                document: document.relatedDocument.label,
              })}
            </Link>
            <Link href="/" data-testid="legal-back-home">
              {legal("backHome")}
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}

function LegalBlockRenderer({ block }: { block: LegalBlock }) {
  if (block.type === "paragraph") {
    return <p>{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="legal-table-wrap">
      <table>
        <thead>
          <tr>
            {block.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
