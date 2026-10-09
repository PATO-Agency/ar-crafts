import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import documents from "../../../features/legal/documents.json";
import { LegalLinks } from "../../../features/legal/legal-links";
import {
  documentBlocks,
  LegalMarkdown,
  sectionId,
} from "../../../features/legal/markdown";

export function generateStaticParams() {
  return documents.map(({ slug }) => ({ document: slug }));
}
type PageProps = { params: Promise<{ document: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { document } = await params;
  const entry = documents.find(({ slug }) => slug === document);
  return {
    title: entry
      ? `${entry.label} · AR Crafts · Borrador`
      : "Documento no encontrado · AR Crafts",
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { document } = await params;
  const entry = documents.find(({ slug }) => slug === document);
  if (!entry) notFound();
  const sections = documentBlocks(entry.markdown).flatMap((block, index) =>
    block.startsWith("## ")
      ? [{ title: block.slice(3), id: sectionId(index) }]
      : [],
  );
  return (
    <div className="legal-page">
      <a className="skip-link" href="#documento">
        Saltar al documento
      </a>
      <header className="legal-header">
        <Link
          className="brand"
          href="/"
          prefetch={false}
          aria-label="AR Crafts · Inicio"
        >
          <span>AR crafts</span>
          <small>ADRIANA RAVELLO</small>
        </Link>
        <Link className="legal-back" href="/" prefetch={false}>
          Volver al inicio
        </Link>
      </header>
      <div className="legal-layout">
        <aside className="legal-contents">
          <nav aria-label="Contenido del documento">
            {sections.map(({ title, id }) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <main id="documento" className="legal-document" tabIndex={-1}>
          <h1>{entry.title}</h1>
          <div className="legal-draft-notice">
            <strong>Documento en borrador</strong>
            <p>
              La identidad legal, jurisdicción y condiciones del negocio aún
              están por confirmar. Este texto se presenta para revisión y no
              como una política definitiva aprobada.
            </p>
          </div>
          <details className="legal-mobile-contents">
            <summary>Contenido del documento</summary>
            <nav aria-label="Contenido del documento">
              {sections.map(({ title, id }) => (
                <a key={id} href={`#${id}`}>
                  {title}
                </a>
              ))}
            </nav>
          </details>
          <LegalMarkdown markdown={entry.markdown} />
          <a className="legal-back" href="#documento">
            Volver al comienzo del documento
          </a>
        </main>
      </div>
      <footer className="legal-footer">
        <Link href="/" prefetch={false}>
          AR Crafts · Inicio
        </Link>
        <LegalLinks current={document} />
      </footer>
    </div>
  );
}
