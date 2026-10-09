"use client";
import { useEffect, useRef } from "react";
export type SectionLink = { id: string; label: string };
export function SiteHeader({ sections }: { sections: SectionLink[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const animations = useRef<Animation[]>([]);
  const desiredOpen = useRef<boolean | undefined>(undefined);
  const stop = () => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
  };
  useEffect(
    () => () => animations.current.forEach((animation) => animation.cancel()),
    [],
  );
  const setExpanded = (open: boolean) =>
    menu.current
      ?.querySelector("summary")
      ?.setAttribute("aria-expanded", String(open));
  const close = (restoreFocus = false) => {
    const details = menu.current;
    const nav = details?.querySelector("nav");
    if (!details || !nav) return;
    desiredOpen.current = false;
    const opacity = getComputedStyle(nav).opacity;
    const transform = getComputedStyle(nav).transform;
    stop();
    setExpanded(false);
    nav.inert = true;
    if (restoreFocus) details.querySelector("summary")?.focus();
    if (!nav.animate) {
      details.open = false;
      return;
    }
    try {
      const animation = nav.animate(
        [
          { opacity, transform },
          { opacity: 0, transform: "translateY(-6px)" },
        ],
        { duration: 140, easing: "ease-out" },
      );
      animations.current.push(animation);
      void animation.finished
        .then(() => {
          if (desiredOpen.current === false) details.open = false;
        })
        .catch(() => undefined);
    } catch {
      details.open = false;
    }
  };
  const open = () => {
    const details = menu.current;
    const nav = details?.querySelector("nav");
    if (!details || !nav) return;
    const opacity = details.open ? getComputedStyle(nav).opacity : "0.4";
    const transform = details.open
      ? getComputedStyle(nav).transform
      : "translateY(-8px)";
    stop();
    desiredOpen.current = true;
    details.open = true;
    nav.inert = false;
    setExpanded(true);
    try {
      if (!nav.animate) return;
      animations.current.push(
        nav.animate(
          [
            { opacity, transform },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        ),
      );
      nav.querySelectorAll("a").forEach((link, index) => {
        animations.current.push(
          link.animate(
            [
              { opacity: 0.5, transform: "translateX(-4px)" },
              { opacity: 1, transform: "translateX(0)" },
            ],
            {
              duration: 180,
              delay: Math.min(index * 20, 100),
              easing: "ease-out",
              fill: "backwards",
            },
          ),
        );
      });
    } catch {
      stop();
    }
  };
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
        onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current?.open) {
            event.preventDefault();
            close(true);
          }
        }}
        onToggle={(event) => {
          const details = event.currentTarget;
          if (!details.open) desiredOpen.current = false;
          if (!Element.prototype.animate) {
            desiredOpen.current = details.open;
            const nav = details.querySelector("nav");
            if (nav) nav.inert = false;
          }
          setExpanded(desiredOpen.current ?? details.open);
        }}
      >
        <summary
          aria-controls="mobile-navigation"
          onClick={(event) => {
            // Without WAAPI, let details/summary keep its native behavior.
            if (!Element.prototype.animate) return;
            event.preventDefault();
            if (desiredOpen.current ?? menu.current?.open) close();
            else open();
          }}
        >
          <span className="sr-only">Menú</span>
          <svg
            aria-hidden="true"
            className="menu-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </summary>
        <nav
          id="mobile-navigation"
          aria-label="Principal móvil"
          onClick={(event) => {
            if ((event.target as Element).closest("a") && menu.current) {
              stop();
              desiredOpen.current = false;
              setExpanded(false);
              menu.current.open = false;
            }
          }}
        >
          {links}
          <a href="#contacto">Hablemos ↗</a>
        </nav>
      </details>
    </header>
  );
}
