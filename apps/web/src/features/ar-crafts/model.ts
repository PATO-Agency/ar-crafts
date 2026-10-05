import type {
  CraftContent,
  CraftImage,
  ContactModel,
} from "@ar-crafts/content";
export type { ContactModel, CraftImage };
export type WorkshopModel = CraftContent["workshops"][number] & {
  priceLabel: string;
  dateLabel: string;
  contactMessage: string;
};
export type MaterialModel = CraftContent["materials"][number] & {
  priceLabel: string;
  contactMessage: string;
};
export interface CraftPageContent {
  demo: boolean;
  preview: boolean;
  unavailable: boolean;
  hero: CraftContent["site"]["hero"];
  about?: CraftContent["site"]["about"];
  contact: ContactModel;
  workshops: WorkshopModel[];
  materials: MaterialModel[];
  gallery: CraftContent["gallery"];
  faq: CraftContent["faq"];
}
