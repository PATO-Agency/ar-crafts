"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="ar-site ar-section">
      <div className="section-shell">
        <p className="eyebrow">AR CRAFTS</p>
        <h1>No pudimos cargar el contenido.</h1>
        <p>Inténtalo de nuevo en un momento.</p>
        <button className="button" onClick={reset}>
          Volver a intentar
        </button>
      </div>
    </main>
  );
}
