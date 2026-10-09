"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function CookieNotice() {
  const [visible, setVisible] = useState(true);
  const notice = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = notice.current;
    if (!visible || !element) return;
    // Reserve space so the last content and focused controls can scroll above it.
    const update = () => {
      document.documentElement.style.setProperty(
        "--cookie-notice-height",
        `${element.getBoundingClientRect().height + 32}px`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cookie-notice-height");
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <aside
      className="cookie-notice"
      aria-labelledby="cookie-notice-title"
      ref={notice}
    >
      <div>
        <h2 id="cookie-notice-title">Sobre las cookies</h2>
        <p>
          La vista previa editorial utiliza una cookie técnica. No hay analítica
          ni publicidad activas en esta versión. Consulta el detalle y los
          pendientes de verificación en nuestra política.
        </p>
      </div>
      <div className="cookie-notice-actions">
        <Link href="/legal/cookies" prefetch={false}>
          Ver política de cookies
        </Link>
        <button
          className="button primary"
          type="button"
          onClick={() => setVisible(false)}
        >
          Cerrar aviso
        </button>
      </div>
    </aside>
  );
}
