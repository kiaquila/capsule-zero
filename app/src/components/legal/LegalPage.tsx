import { Link } from "@/i18n/navigation";
import type { LegalBlock, LegalDocument } from "@/lib/legal-content";

interface LegalPageProps {
  document: LegalDocument;
}

export function LegalPage({ document }: LegalPageProps) {
  return (
    <div className="cz-page legal-page" data-testid="legal-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <header className="landing-header legal-header">
        <Link className="landing-logo" href="/">
          Capsule Zero
        </Link>
        <nav className="legal-header-links" aria-label="Legal documents">
          <Link
            className={document.slug === "terms-of-use" ? "legal-link-active" : ""}
            href="/terms-of-use"
          >
            Terms
          </Link>
          <Link
            className={
              document.slug === "privacy-policy" ? "legal-link-active" : ""
            }
            href="/privacy-policy"
          >
            Privacy
          </Link>
        </nav>
      </header>

      <main className="legal-main">
        <section className="legal-index dashboard-glass">
          <p className="legal-eyebrow">{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <dl className="legal-meta">
            <div>
              <dt>Last updated</dt>
              <dd>{document.lastUpdated}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{document.effectiveDate}</dd>
            </div>
          </dl>
          <div className="legal-toc" aria-label="Contents">
            <p>Contents</p>
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
          {document.sections.map((section) => (
            <section className="legal-section" id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <LegalBlockRenderer block={block} key={`${section.id}-${index}`} />
              ))}
            </section>
          ))}

          <footer className="legal-article-footer">
            <Link href={document.relatedDocument.href}>
              Read the {document.relatedDocument.label}
            </Link>
            <Link href="/" data-testid="legal-back-home">
              Back to Capsule Zero
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
