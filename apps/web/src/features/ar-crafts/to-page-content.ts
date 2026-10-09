import {
  approvedCraftContent,
  isUpcomingEdition,
  type CraftContent,
} from "@ar-crafts/content";
import type { CraftPageContent } from "./model";
const money = (price: number | undefined) =>
  price === undefined
    ? "Consultar precio"
    : new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(price);
export function toCraftPageContent(
  input: CraftContent | null,
  { demo = false, preview = false, now = new Date(), unavailable = false } = {},
): CraftPageContent {
  const content = demo
    ? input
    : input
      ? approvedCraftContent(input, preview)
      : null;
  if (!content)
    return {
      demo: false,
      preview,
      unavailable,
      hero: {
        eyebrow: "AR CRAFTS · JOYERÍA ARTESANAL",
        title: "De la naturaleza\na tus manos.",
        text: "Estamos preparando la información de talleres y materiales.",
      },
      workshops: [],
      materials: [],
      gallery: [],
      faq: [],
      contact: { confirmed: false },
    };
  return {
    demo,
    preview,
    unavailable,
    hero: content.site.hero,
    about: content.site.about,
    pageCopy: content.site.pageCopy,
    contact: demo ? { confirmed: false } : content.site.contact,
    workshops: content.workshops.map((workshop) => {
      const editions = content.editions
        .filter(
          (e) =>
            e.workshopId.replace(/^drafts\./, "") ===
              workshop.id.replace(/^drafts\./, "") && isUpcomingEdition(e, now),
        )
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
      const schedule = editions.map((edition) => ({
        endsAt: edition.endsAt,
        dateLabel:
          new Intl.DateTimeFormat("es-PE", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "America/Lima",
          }).format(new Date(edition.startsAt)) + " · hora de Lima",
      }));
      return {
        ...workshop,
        priceLabel: money(workshop.price),
        dateLabel: schedule[0]?.dateLabel ?? "Próxima fecha por confirmar",
        ...(!demo && !preview ? { editionSchedule: schedule } : {}),
        contactMessage: `Hola, quisiera consultar por el taller ${workshop.title.replace(/\n/g, " ")}.`,
      };
    }),
    materials: content.materials
      .filter((v) => v.status !== "hidden")
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .map((v) => ({
        ...v,
        priceLabel: money(v.price),
        contactMessage: `Hola, quisiera consultar ${v.status === "unavailable" ? "alternativas a" : "por"} ${v.title}, ${v.presentationLabel}.`,
      })),
    gallery: (() => {
      const sequence = (["piece", "detail", "hands"] as const)
        .map((step) => content.gallery.find((item) => item.step === step))
        .filter((item) => item !== undefined);
      return [
        ...sequence,
        ...content.gallery.filter((item) => !sequence.includes(item)),
      ];
    })(),
    faq: content.faq,
  };
}
