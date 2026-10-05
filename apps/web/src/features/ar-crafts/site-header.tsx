"use client";
import { useRef } from "react";
export type SectionLink = { id: string; label: string };
export function SiteHeader({ sections }: { sections: SectionLink[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const links = sections.map((section) => (
    <a key={section.id} href={`#${section.id}`}>
      {section.label}
    </a>
  ));
  return (
    <header className="site-header">
      <a href="#inicio" className="brand" aria-label="AR crafts · inicio">
        <span>AR crafts</span>
        <small>ADRIANA RAVELLO</small>
      </a>
      <nav className="desktop-nav" aria-label="Principal">
        {links.slice(0, 3)}
        <a className="button" href="#contacto">
          Hablemos <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <details
        className="mobile-menu"
        ref={menu}
        onToggle={(event) =>
          event.currentTarget
            .querySelector("summary")
            ?.setAttribute("aria-expanded", String(event.currentTarget.open))
        }
      >
        <summary aria-controls="mobile-navigation">
          <span className="sr-only">Menú</span>
          <span aria-hidden="true" className="menu-icon">
            ☰
          </span>
        </summary>
        <nav
          id="mobile-navigation"
          aria-label="Principal móvil"
          onClick={(event) => {
            if ((event.target as Element).closest("a") && menu.current)
              menu.current.open = false;
          }}
        >
          {links}
          <a href="#contacto">Hablemos ↗</a>
        </nav>
      </details>
    </header>
  );
}
