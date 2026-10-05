import { buildWhatsAppUrl } from "@pato-food/content-contract";
import { ConversionLink } from "@pato-food/ui";
import type { ContactModel } from "./model";
export function contactUrl(contact: ContactModel, message: string) {
  if (!contact.confirmed) return null;
  return buildWhatsAppUrl({
    enabled: true,
    destinationE164: contact.destinationE164,
    prefilledMessage: message,
    intent: "inquiry",
    ctaLabel: "Consultar",
    placements: ["menu", "footer"],
    fallbackLabel: "Contacto por confirmar",
    contentStatus: "approved",
    sourceRef: "ar-crafts-confirmed-contact",
  });
}
export function ContactLink({
  contact,
  message,
  label,
  journey,
  contentId,
  final = false,
}: {
  contact: ContactModel;
  message: string;
  label: string;
  journey: "workshop" | "material" | "general";
  contentId?: string;
  final?: boolean;
}) {
  const href = contactUrl(contact, message);
  if (!href && !final)
    return (
      <a className="button" href="#contacto">
        Ver contacto <span aria-hidden="true">↗</span>
        <span className="sr-only"> · {label}</span>
      </a>
    );
  return (
    <ConversionLink
      href={href}
      location={final ? "footer" : "menu"}
      intent="inquiry"
      siteKey="ar-crafts"
      journey={journey}
      contentId={contentId}
      disabledLabel="El canal se habilitará cuando el contacto esté confirmado."
    >
      {href ? label : "Contacto por confirmar"}
    </ConversionLink>
  );
}
