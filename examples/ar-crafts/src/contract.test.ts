import { describe, expect, it } from "vitest";
import { arCraftsFixture } from "./fixture";
import {
  approvedCraftContent,
  craftPageCopySchema,
  isUpcomingEdition,
  parseCraftContent,
} from "./contract";
const approved = <T extends { contentStatus: string }>(item: T): T => ({
  ...item,
  contentStatus: "approved",
  approvedAt: "2026-10-03T12:00:00Z",
});
describe("AR Crafts content boundaries", () => {
  it("accepts absent and partial page copy without changing legacy content", () => {
    expect(parseCraftContent(arCraftsFixture).site.pageCopy).toBeUndefined();
    const pageCopy = {
      journeys: { workshop: { title: "Crear con cuentas" } },
      about: { eyebrow: "Nuestra historia" },
      inspiration: { stories: { hands: "Trabajo artesanal." } },
    };
    expect(
      parseCraftContent({
        ...arCraftsFixture,
        site: { ...arCraftsFixture.site, pageCopy },
      }).site.pageCopy,
    ).toEqual(pageCopy);
    expect(craftPageCopySchema.parse({ workshops: {}, footer: {} })).toEqual({
      workshops: {},
      footer: {},
    });
  });
  it("rejects blank, overlong and nontext page copy at nested editorial fields", () => {
    for (const pageCopy of [
      { hero: { secondary: " " } },
      { journeys: { workshop: { title: "x".repeat(181) } } },
      { workshops: { eyebrow: "x".repeat(121) } },
      { contact: { text: "x".repeat(801) } },
      { inspiration: { stories: { detail: "x".repeat(301) } } },
      { footer: { text: 42 } },
    ])
      expect(craftPageCopySchema.safeParse(pageCopy).success).toBe(false);
    expect(
      craftPageCopySchema.parse({ faq: { title: "  Preguntas  " } }),
    ).toEqual({ faq: { title: "Preguntas" } });
  });
  it("accepts offset-aware provenance, requires approval dates and rejects ambiguous provenance", () => {
    const input = structuredClone(arCraftsFixture);
    input.site = approved(input.site);
    input.site.approvedAt = "2026-10-03T07:00:00-05:00";
    input.site.sourceObservedAt = "2026-10-02T07:00:00-05:00";
    expect(parseCraftContent(input).site.approvedAt).toBe(
      input.site.approvedAt,
    );
    delete input.site.approvedAt;
    expect(() => parseCraftContent(input)).toThrow();
    input.site = {
      ...arCraftsFixture.site,
      sourceObservedAt: "2026-10-02T07:00:00",
    };
    expect(() => parseCraftContent(input)).toThrow();
  });
  it("normalizes cleared optional labels while rejecting blank required text and image alt", () => {
    const input = structuredClone(arCraftsFixture);
    input.site.hero.mobileText = "  ";
    input.workshops[0].level = " ";
    input.workshops[0].mode = "";
    input.materials[0].code = " ";
    const parsed = parseCraftContent(input);
    expect(parsed.site.hero.mobileText).toBeUndefined();
    expect(parsed.workshops[0].level).toBeUndefined();
    expect(parsed.workshops[0].mode).toBeUndefined();
    expect(parsed.materials[0].code).toBeUndefined();
    input.site.hero.title = "  ";
    expect(() => parseCraftContent(input)).toThrow();
    input.site.hero.title = arCraftsFixture.site.hero.title;
    input.gallery[0].image.alt = " ";
    expect(() => parseCraftContent(input)).toThrow();
  });
  it("requires approved inspiration to be an authorized photograph", () => {
    const input = structuredClone(arCraftsFixture);
    input.gallery[0] = approved(input.gallery[0]);
    expect(() => parseCraftContent(input)).toThrow();
    input.gallery[0].image.kind = "photograph";
    expect(() => parseCraftContent(input)).toThrow();
    input.gallery[0].image.rightsConfirmed = true;
    expect(parseCraftContent(input).gallery[0].image.kind).toBe("photograph");
  });
  it("expires exactly at 18:00 in Lima", () => {
    const edition = { endsAt: "2026-10-10T18:00:00-05:00" };
    expect(isUpcomingEdition(edition, new Date("2026-10-10T22:59:59Z"))).toBe(
      true,
    );
    expect(isUpcomingEdition(edition, new Date("2026-10-10T23:00:00Z"))).toBe(
      false,
    );
  });
  it("keeps demo, drafts and pending items outside published content", () => {
    expect(approvedCraftContent(arCraftsFixture)).toBeNull();
    const input = structuredClone(arCraftsFixture);
    input.site = approved(input.site);
    input.workshops = [
      approved(input.workshops[0]),
      { ...approved(input.workshops[1]), id: "drafts.macrame" },
      input.workshops[2],
    ];
    expect(approvedCraftContent(input)?.workshops.map((v) => v.id)).toEqual([
      "miyuki",
    ]);
    expect(approvedCraftContent(input, true)?.workshops).toHaveLength(3);
    input.site = { ...input.site, id: "drafts.ar-site" };
    expect(approvedCraftContent(input)).toBeNull();
  });
  it("omits conceptual art and photographs without rights in published gallery", () => {
    const input = structuredClone(arCraftsFixture);
    input.site = approved(input.site);
    input.gallery = input.gallery.map(approved);
    input.gallery[0].image.kind = "photograph";
    input.gallery[0].image.rightsConfirmed = true;
    input.gallery[1].image.kind = "photograph";
    expect(approvedCraftContent(input)?.gallery.map((v) => v.id)).toEqual([
      "inspiration-piece",
    ]);
  });
  it("rejects ambiguous dates, zero prices and an unverified phone model", () => {
    const input = structuredClone(arCraftsFixture);
    input.editions = [
      {
        ...input.workshops[0],
        workshopId: "miyuki",
        startsAt: "2026-10-10T10:00:00",
        endsAt: "2026-10-10T18:00:00",
        timeZone: "America/Lima",
      },
    ];
    expect(() => parseCraftContent(input)).toThrow();
    expect(() =>
      parseCraftContent({
        ...arCraftsFixture,
        materials: [{ ...arCraftsFixture.materials[0], price: 0 }],
      }),
    ).toThrow();
    expect(() =>
      parseCraftContent({
        ...arCraftsFixture,
        site: {
          ...arCraftsFixture.site,
          contact: { confirmed: true, destinationE164: "unconfirmed" },
        },
      }),
    ).toThrow();
  });
});
