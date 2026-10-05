import { SectionHeading } from "@pato-food/ui";
import type { CraftPageContent } from "./model";
import { CraftArtwork } from "./artwork";
import { SiteHeader } from "./site-header";
import { MaterialsSection } from "./materials-section";
import { ContactLink } from "./contact-link";
import { Botanical } from "./botanical";
import { CraftMotion } from "./motion";
import { ButterflyArtwork } from "./butterfly-artwork";

export function CraftPageView({
  content,
  previewExitAvailable = false,
}: {
  content: CraftPageContent;
  previewExitAvailable?: boolean;
}) {
  const sections = [
    { id: "talleres", label: "Talleres" },
    { id: "materiales", label: "Materiales" },
    ...(content.about
      ? [{ id: "sobre-adriana", label: "Nuestra esencia" }]
      : []),
    ...(content.gallery.length
      ? [{ id: "galeria", label: "Inspiración" }]
      : []),
    ...(content.faq.length ? [{ id: "preguntas", label: "Preguntas" }] : []),
  ];
  return (
    <div
      className="ar-site"
      id="inicio"
      data-motion-policy={content.demo ? "always" : "system"}
    >
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SiteHeader sections={sections} />
      <main id="contenido" tabIndex={-1}>
        <div className="hero-scene">
          <section className="hero" aria-labelledby="hero-title">
            <p className="eyebrow hero-mobile-eyebrow">
              CREA · APRENDE · INSPÍRATE
            </p>
            <div className="hero-copy">
              <p className="eyebrow">{content.hero.eyebrow}</p>
              <h1 id="hero-title">
                {content.hero.title
                  .split("\n")
                  .map((line, index) =>
                    index ? (
                      <em key={index}>{line}</em>
                    ) : (
                      <span key={index}>{line}</span>
                    ),
                  )}
              </h1>
              <p
                className={`hero-description ${content.hero.mobileText ? "desktop-description" : ""}`}
              >
                {content.hero.text}
              </p>
              {content.hero.mobileText && (
                <p className="hero-description mobile-description">
                  {content.hero.mobileText}
                </p>
              )}
              <div className="hero-actions">
                <a className="button primary" href="#talleres">
                  Explorar talleres <span aria-hidden="true">↗</span>
                </a>
                <a className="button" href="#materiales">
                  Ver materiales <span aria-hidden="true">↗</span>
                </a>
              </div>
              <p className="secondary">
                Pequeños detalles. Infinitas posibilidades.
              </p>
              <p className="scroll-cue" aria-hidden="true">
                <span>↓</span> Desliza. Mira cómo florecen las ideas.
              </p>
            </div>
            <ButterflyArtwork />
            <Botanical index={0} hero />
          </section>
        </div>
        {(content.demo || content.preview || content.unavailable) && (
          <aside className="demo-notice" aria-label="Estado del contenido">
            {content.unavailable
              ? "Información temporalmente no disponible. Contacto por confirmar."
              : content.preview
                ? "Vista previa editorial · incluye contenido pendiente de aprobación."
                : "Contenido de demostración · ilustraciones conceptuales, no fotografías reales. Fechas, precios y disponibilidad por confirmar."}
            {previewExitAvailable && (
              <a href="/api/draft/disable">Salir de vista previa</a>
            )}
          </aside>
        )}
        <div className="signature-strip" aria-hidden="true">
          <span>INSPIRACIÓN BOTÁNICA</span>
          <span>ARTE EN CADA CUENTA</span>
          <span>CREATIVIDAD QUE FLORECE</span>
        </div>
        <section
          className="ar-section journeys"
          aria-labelledby="journey-title"
        >
          <p className="eyebrow">ENCUENTRA TU FORMA DE CREAR</p>
          <h2 id="journey-title">
            Una idea puede convertirse en algo hermoso.
          </h2>
          <div className="journey-grid">
            <a href="#talleres" className="journey-card">
              <span className="eyebrow">01 / TALLERES</span>
              <h3>
                Aprende a dar vida
                <br />a tus ideas.
              </h3>
              <p>
                Explora técnicas de joyería artesanal y crea con tus propias
                manos.
              </p>
              <span className="text-link">Conocer talleres ↗</span>
            </a>
            <a href="#materiales" className="journey-card pink">
              <span className="eyebrow">02 / MATERIALES</span>
              <h3>
                Todo empieza
                <br />
                con una cuenta.
              </h3>
              <p>
                Encuentra insumos para tus proyectos y descubre nuevas
                posibilidades.
              </p>
              <span className="text-link">Explorar materiales ↗</span>
            </a>
          </div>
        </section>
        <Botanical index={1} />
        <section
          id="talleres"
          className="ar-section"
          tabIndex={-1}
          aria-labelledby="workshops-title"
        >
          <div className="section-heading">
            <p className="eyebrow">01 / APRENDE A CREAR</p>
            <h2 id="workshops-title">
              Tu creatividad,
              <br />
              cuenta por cuenta.
            </h2>
            <p>
              Explora técnicas de joyería artesanal y consulta por el próximo
              taller.
            </p>
          </div>
          {!content.workshops.length ? (
            <p className="empty-state">
              No hay próximos talleres publicados. Las próximas fechas están por
              confirmar.
            </p>
          ) : (
            <div className="craft-grid">
              {content.workshops.map((workshop) => (
                <article className="craft-card" key={workshop.id}>
                  <CraftArtwork image={workshop.image} />
                  <p className="eyebrow">{workshop.technique}</p>
                  <h3>{workshop.title}</h3>
                  <p className="secondary">{workshop.dateLabel}</p>
                  <details className="workshop-details">
                    <summary>Detalles del taller</summary>
                    <p>{workshop.details}</p>
                    {(workshop.level || workshop.mode) && (
                      <p>
                        {[workshop.level, workshop.mode]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </details>
                  <p className="secondary">{workshop.priceLabel}</p>
                  <ContactLink
                    contact={content.contact}
                    message={workshop.contactMessage}
                    label="Consultar taller"
                    journey="workshop"
                    contentId={workshop.id}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
        <Botanical index={2} />
        <MaterialsSection
          materials={content.materials}
          contact={content.contact}
        />
        <Botanical index={3} />
        {content.about && (
          <section
            id="sobre-adriana"
            className="ar-section essence"
            tabIndex={-1}
            aria-label="Nuestra esencia"
          >
            <CraftArtwork image={content.about.image} />
            <div className="essence-copy">
              <SectionHeading
                eyebrow="LA ESENCIA DE AR CRAFTS"
                title="La naturaleza inspira. Tus manos transforman."
                text={content.about.text}
              />
              <p className="brand-signature">Adriana Ravello</p>
              <p className="eyebrow">CREAR · APRENDER · COMPARTIR</p>
              <a className="button" href="#contacto">
                Conversemos ↗
              </a>
            </div>
          </section>
        )}
        <Botanical index={4} />
        {content.gallery.length > 0 && (
          <section
            id="galeria"
            className="ar-section inspiration-section"
            tabIndex={-1}
            aria-labelledby="inspiration-title"
          >
            <div
              className="inspiration-scene"
              data-scene-eligible={
                content.gallery
                  .slice(0, 3)
                  .map((item) => item.step)
                  .join(",") === "piece,detail,hands"
              }
            >
              <div className="inspiration-sticky">
                <div className="inspiration-narrative">
                  <div className="section-heading">
                    <p className="eyebrow">UN UNIVERSO DE PEQUEÑOS DETALLES</p>
                    <h2 id="inspiration-title">Ideas que florecen.</h2>
                    <p>
                      Naturaleza, color y textura como punto de partida para
                      crear.
                    </p>
                  </div>
                  <ol
                    className="scene-steps"
                    aria-label="Secuencia de inspiración"
                  >
                    <li className="scene-step">01 · Pieza</li>
                    <li className="scene-step">02 · Detalle</li>
                    <li className="scene-step">03 · Manos</li>
                  </ol>
                  <div className="scene-progress" aria-hidden="true">
                    <span />
                  </div>
                  <div className="scene-stories">
                    <p className="scene-story">
                      Una forma de la naturaleza se convierte en una pieza.
                    </p>
                    <p className="scene-story">
                      Acércate. Cada cuenta guarda un pequeño universo.
                    </p>
                    <p className="scene-story">
                      El detalle cobra vida entre tus manos.
                    </p>
                  </div>
                </div>
                <div className="inspiration-images">
                  {content.gallery.slice(0, 3).map((item) => (
                    <figure className="inspiration-slide" key={item.id}>
                      <CraftArtwork image={item.image} />
                      <figcaption>{item.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
            {content.gallery.length > 3 && (
              <div className="inspiration-images gallery-extra">
                {content.gallery.slice(3).map((item) => (
                  <figure key={item.id}>
                    <CraftArtwork image={item.image} />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        )}
        <Botanical index={5} />
        {content.faq.length > 0 && (
          <section
            id="preguntas"
            className="ar-section faq"
            tabIndex={-1}
            aria-labelledby="faq-title"
          >
            <div className="section-heading">
              <p className="eyebrow">ANTES DE EMPEZAR</p>
              <h2 id="faq-title">
                Toda creación
                <br />
                empieza con una pregunta.
              </h2>
              <p>
                Conversemos para encontrar el taller o los materiales que
                necesitas.
              </p>
            </div>
            {content.faq.map((item) => (
              <details key={item.id}>
                <summary>
                  {item.question}
                  <span className="faq-icon" aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        )}
        <Botanical index={6} />
        <section
          id="contacto"
          className="ar-section"
          tabIndex={-1}
          aria-labelledby="contact-title"
        >
          <div className="contact-garden">
            <p className="eyebrow">DALE FORMA A TU PRÓXIMA IDEA</p>
            <h2 id="contact-title">
              Algo hermoso
              <br />
              puede empezar aquí.
            </h2>
            <p>
              Consulta por talleres o materiales y cuéntanos qué te gustaría
              crear.
            </p>
            <ContactLink
              contact={content.contact}
              message="Hola, quisiera consultar por talleres y materiales de AR Crafts."
              label="Hablemos por WhatsApp"
              journey="general"
              final
            />
            <p className="secondary">
              Los enlaces oficiales y el canal de contacto están por confirmar.
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="brand">
          <span>AR crafts</span>
          <small>ADRIANA RAVELLO</small>
        </div>
        <nav aria-label="Pie de página">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
          <a href="#contacto">Contacto</a>
        </nav>
        <div>
          <p>
            Inspiración botánica.
            <br />
            Arte en cada cuenta.
          </p>
          <p className="secondary">
            {content.demo
              ? "Exploración visual · contenido e imágenes ilustrativos."
              : "Versión local de revisión · sin publicación."}
          </p>
        </div>
      </footer>
      <CraftMotion />
    </div>
  );
}
