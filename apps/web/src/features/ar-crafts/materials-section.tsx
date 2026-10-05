import type { ContactModel, MaterialModel } from "./model";
import { ContactLink } from "./contact-link";
import { CraftArtwork } from "./artwork";
export function MaterialCard({
  material,
  contact,
}: {
  material: MaterialModel;
  contact: ContactModel;
}) {
  return (
    <article className="craft-card">
      <CraftArtwork image={material.image} />
      <h3>{material.title}</h3>
      <p className="secondary">{material.presentationLabel}</p>
      <p className="secondary">
        {material.status === "unavailable"
          ? "No disponible · consulta alternativas"
          : "Consultar disponibilidad"}{" "}
        · {material.priceLabel}
      </p>
      <ContactLink
        contact={contact}
        message={material.contactMessage}
        label={
          material.status === "unavailable"
            ? "Consultar alternativas"
            : "Consultar material"
        }
        journey="material"
        contentId={material.id}
      />
    </article>
  );
}
export function MaterialsSection({
  materials,
  contact,
}: {
  materials: MaterialModel[];
  contact: ContactModel;
}) {
  return (
    <section
      id="materiales"
      className="ar-section"
      tabIndex={-1}
      aria-labelledby="materials-title"
    >
      <div className="section-heading">
        <p className="eyebrow">02 / ENCUENTRA TUS MATERIALES</p>
        <h2 id="materials-title">
          Cada detalle abre
          <br />
          una posibilidad.
        </h2>
        <p>
          Colores, hilos y herramientas para dar forma a tu próxima creación.
        </p>
      </div>
      {!materials.length ? (
        <p className="empty-state">
          Estamos preparando las presentaciones de materiales. La disponibilidad
          está por confirmar.
        </p>
      ) : (
        <div className="craft-grid">
          {materials.slice(0, 6).map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              contact={contact}
            />
          ))}
        </div>
      )}
      {materials.length > 6 && (
        <details className="materials-disclosure">
          <summary className="button">
            Ver todos los materiales ({materials.length})
          </summary>
          <div className="craft-grid">
            {materials.slice(6).map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                contact={contact}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
