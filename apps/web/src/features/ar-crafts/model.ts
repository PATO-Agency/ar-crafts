import type {
  CraftContent,
  CraftImage,
  CraftPageCopy,
  ContactModel,
} from "@ar-crafts/content";
export type { ContactModel, CraftImage };
export type WorkshopDateEdition = {
  endsAt: string;
  dateLabel: string;
};
export type WorkshopModel = CraftContent["workshops"][number] & {
  priceLabel: string;
  dateLabel: string;
  editionSchedule?: WorkshopDateEdition[];
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
  pageCopy?: CraftPageCopy;
  about?: CraftContent["site"]["about"];
  contact: ContactModel;
  workshops: WorkshopModel[];
  materials: MaterialModel[];
  gallery: CraftContent["gallery"];
  faq: CraftContent["faq"];
}
