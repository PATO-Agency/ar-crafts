import { describe, expect, it } from "vitest";
import { publishedCraftQuery, previewCraftQuery } from "./queries";
// Executes the actual query using the explicitly declared development dependency.
import { evaluate, parse } from "groq-js";
import { parseCraftContent } from "./contract";
import { arCraftsFixture } from "./fixture";
describe("AR page query eligibility", () => {
  for (const [name, query] of Object.entries({
    published: publishedCraftQuery,
    preview: previewCraftQuery,
  })) {
    it(`${name} projects partial page copy through the actual query and contract`, async () => {
      const pageCopy = {
        workshops: { title: "Talleres de prueba" },
        inspiration: { stories: { piece: "Una pieza de muestra." } },
      };
      const projected = await (
        await evaluate(parse(query), {
          dataset: [
            {
              ...arCraftsFixture.site,
              _id: "arSite",
              _type: "arSite",
              contentStatus: "approved",
              approvedAt: "2026-10-03T12:00:00Z",
              pageCopy,
            },
          ],
          params: { now: "2026-10-06T12:00:00Z" },
        })
      ).get();
      expect(parseCraftContent(projected).site.pageCopy).toEqual(pageCopy);
    });
    it(`${name} retains future editions after more than 30 historical entries`, async () => {
      const provenance = {
        contentStatus: "approved",
        sourceRef: "Synthetic regression",
        approvedAt: "2026-10-03T12:00:00Z",
      };
      const historical = Array.from({ length: 40 }, (_, index) => ({
        ...provenance,
        _id: `past-${index}`,
        _type: "arWorkshopEdition",
        workshop: { _ref: "miyuki" },
        startsAt: "2026-10-01T10:00:00-05:00",
        endsAt: "2026-10-01T18:00:00-05:00",
        timeZone: "America/Lima",
      }));
      const upcoming = {
        ...historical[0],
        _id: "future",
        startsAt: "2026-10-10T10:00:00-05:00",
        endsAt: "2026-10-10T18:00:00-05:00",
      };
      const projected = await (
        await evaluate(parse(query), {
          dataset: [
            {
              ...arCraftsFixture.site,
              ...provenance,
              _id: "arSite",
              _type: "arSite",
            },
            ...historical,
            upcoming,
          ],
          params: { now: "2026-10-06T12:00:00Z" },
        })
      ).get();
      expect(
        parseCraftContent(projected).editions.map((edition) => edition.id),
      ).toEqual(["future"]);
      const expired = await (
        await evaluate(parse(query), {
          dataset: [upcoming],
          params: { now: "2026-10-10T23:00:00Z" },
        })
      ).get();
      expect(expired.editions).toEqual([]);
    });
    it(`${name} filters expired editions before sorting and slicing`, () => {
      expect(query).toMatch(
        /"editions": \*\[.*dateTime\(endsAt\) > dateTime\(\$now\)\] \| order\(startsAt asc\)\[0\.\.\.30\]/,
      );
      expect(query).toContain("defined(image.asset) && defined(image.alt)");
    });
  }
});
