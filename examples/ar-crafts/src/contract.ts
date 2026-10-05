import { z } from "zod";
import {
  editorialSchema,
  imageSchema,
  e164Schema,
} from "@pato-food/content-contract";

const text = (max: number) => z.string().trim().min(1).max(max);
const editorial = editorialSchema.extend({ id: text(120) });
export const craftImageSchema = imageSchema.extend({
  kind: z.enum(["illustration", "photograph"]),
});
export const contactSchema = z.discriminatedUnion("confirmed", [
  z.object({ confirmed: z.literal(false) }),
  z.object({ confirmed: z.literal(true), destinationE164: e164Schema }),
]);
export const editionSchema = editorial
  .extend({
    workshopId: text(120),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    timeZone: z.literal("America/Lima"),
  })
  .refine(
    (v) => Date.parse(v.endsAt) > Date.parse(v.startsAt),
    "End must follow start",
  );
export const workshopSchema = editorial.extend({
  title: text(120),
  technique: text(60),
  details: text(600),
  level: text(80).optional(),
  mode: text(80).optional(),
  price: z.number().positive().optional(),
  image: craftImageSchema.optional(),
});
export const materialSchema = editorial.extend({
  title: text(120),
  presentationLabel: text(160),
  code: text(40).optional(),
  price: z.number().positive().optional(),
  image: craftImageSchema.optional(),
  status: z.enum(["inquiry", "unavailable", "hidden"]),
  featured: z.boolean(),
});
const gallerySchema = editorial.extend({
  image: craftImageSchema,
  caption: text(120),
  step: z.enum(["piece", "detail", "hands"]),
});
const faqSchema = editorial.extend({ question: text(180), answer: text(800) });
const siteSchema = editorial.extend({
  hero: z.object({
    eyebrow: text(120),
    title: text(160),
    text: text(500),
    mobileText: text(500).optional(),
  }),
  about: z
    .object({ text: text(800), image: craftImageSchema.optional() })
    .optional(),
  contact: contactSchema,
});
export const craftContentSchema = z.object({
  site: siteSchema,
  workshops: z.array(workshopSchema).max(3),
  editions: z.array(editionSchema).max(30),
  materials: z.array(materialSchema).max(12),
  gallery: z.array(gallerySchema).max(8),
  faq: z.array(faqSchema).max(6),
});
export type CraftContent = z.infer<typeof craftContentSchema>;
export type ContactModel = z.infer<typeof contactSchema>;
export type CraftImage = z.infer<typeof craftImageSchema>;
export function parseCraftContent(input: unknown): CraftContent {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => v !== null)
          .map(([k, v]) => [k, normalize(v)]),
      );
    return value;
  };
  return craftContentSchema.parse(normalize(input));
}
export function isUpcomingEdition(
  edition: { endsAt: string },
  now: Date,
): boolean {
  return Date.parse(edition.endsAt) > now.getTime();
}
export function isApproved(
  document: z.infer<typeof editorialSchema> & { id: string },
): boolean {
  return (
    document.contentStatus === "approved" &&
    Boolean(document.approvedAt) &&
    !/^(drafts|versions)\./.test(document.id)
  );
}
export function approvedCraftContent(
  content: CraftContent,
  preview = false,
): CraftContent | null {
  if (preview) return content;
  if (!isApproved(content.site)) return null;
  const approved = <T extends z.infer<typeof editorial>>(items: T[]) =>
    items.filter(isApproved);
  const image = (value: CraftImage | undefined) =>
    value?.rightsConfirmed && value.kind === "photograph" ? value : undefined;
  return {
    site: {
      ...content.site,
      about: content.site.about
        ? { ...content.site.about, image: image(content.site.about.image) }
        : undefined,
    },
    workshops: approved(content.workshops).map((v) => ({
      ...v,
      image: image(v.image),
    })),
    editions: approved(content.editions),
    materials: approved(content.materials).map((v) => ({
      ...v,
      image: image(v.image),
    })),
    gallery: approved(content.gallery).filter((v) => Boolean(image(v.image))),
    faq: approved(content.faq),
  };
}
