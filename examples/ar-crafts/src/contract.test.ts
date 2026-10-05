import { describe, expect, it } from "vitest";
import { arCraftsFixture } from "./fixture";
import {
  approvedCraftContent,
  isUpcomingEdition,
  parseCraftContent,
} from "./contract";
const approved = <T extends { contentStatus: string }>(item: T): T => ({
  ...item,
  contentStatus: "approved",
  approvedAt: "2026-10-03T12:00:00Z",
});
describe("AR Crafts content boundaries", () => {
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
