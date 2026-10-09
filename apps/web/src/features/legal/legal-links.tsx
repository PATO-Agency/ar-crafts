import Link from "next/link";
import { legalLinks } from "./links";

export function LegalLinks({ current }: { current?: string }) {
  return (
    <nav className="legal-links" aria-label="Información legal">
      {legalLinks.map(({ slug, label }) => (
        <Link
          key={slug}
          href={`/legal/${slug}`}
          aria-current={current === slug ? "page" : undefined}
          prefetch={false}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
