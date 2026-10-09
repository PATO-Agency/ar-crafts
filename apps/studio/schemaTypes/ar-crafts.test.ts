import { describe, expect, it, vi } from "vitest";
import { arSchemaTypes } from "./ar-crafts";

type Custom = (
  value: unknown,
  context: { document?: Record<string, unknown> },
) => unknown;
type Field = {
  name: string;
  fields?: Field[];
  validation?: (rule: unknown) => unknown;
};
function validate(
  type: string,
  path: string,
  value: unknown,
  document: Record<string, unknown> = {},
) {
  const schema = arSchemaTypes.find((entry) => entry.name === type)!;
  let fields = schema.fields as unknown as Field[];
  let field: Field | undefined;
  for (const name of path.split(".")) {
    field = fields.find((entry) => entry.name === name);
    fields = field?.fields ?? [];
  }
  const checks: Custom[] = [];
  const rule = {
    required: () => rule,
    min: () => rule,
    max: () => rule,
    positive: () => rule,
    integer: () => rule,
    custom: (check: Custom) => {
      checks.push(check);
      return rule;
    },
  };
  field?.validation?.(rule);
  expect(checks.length).toBeGreaterThan(0);
  return checks.map((check) => check(value, { document }));
}
describe("AR Studio validation coherence", () => {
  it("keeps section copy optional with bounded fields and descriptive document previews", () => {
    const site = arSchemaTypes.find((entry) => entry.name === "arSite")!;
    const copy = (site.fields as unknown as Field[]).find(
      (entry) => entry.name === "pageCopy",
    )!;
    expect(copy.validation).toBeUndefined();
    const expected = {
      hero: { mobileEyebrow: 120, secondary: 800, scrollCue: 800 },
      journeys: {
        eyebrow: 120,
        title: 180,
        workshop: { title: 180, text: 800 },
        materials: { title: 180, text: 800 },
      },
      workshops: { eyebrow: 120, title: 180, text: 800 },
      materials: { eyebrow: 120, title: 180, text: 800 },
      about: { eyebrow: 120, title: 180 },
      inspiration: {
        eyebrow: 120,
        title: 180,
        text: 800,
        stories: { piece: 300, detail: 300, hands: 300 },
      },
      faq: { eyebrow: 120, title: 180, text: 800 },
      contact: { eyebrow: 120, title: 180, text: 800 },
      footer: { text: 800 },
    };
    function inspect(
      fields: Field[],
      limits: Record<string, unknown>,
      path: string,
    ) {
      expect(fields.map((field) => field.name).sort()).toEqual(
        Object.keys(limits).sort(),
      );
      for (const [name, limit] of Object.entries(limits)) {
        const field = fields.find((entry) => entry.name === name)!;
        if (typeof limit === "object") {
          expect(field.validation).toBeUndefined();
          inspect(
            field.fields!,
            limit as Record<string, unknown>,
            `${path}.${name}`,
          );
          continue;
        }
        const maximum = vi.fn();
        const required = vi.fn();
        const rule = {
          max: (value: number) => {
            maximum(value);
            return rule;
          },
          required: () => {
            required();
            return rule;
          },
          custom: () => rule,
        };
        field.validation!(rule);
        expect(maximum).toHaveBeenCalledWith(limit);
        expect(required).not.toHaveBeenCalled();
        expect(validate("arSite", `${path}.${name}`, undefined)).toEqual([
          true,
        ]);
        expect(
          validate("arSite", `${path}.${name}`, "Texto editorial"),
        ).toEqual([true]);
        expect(validate("arSite", `${path}.${name}`, " ")).toEqual([
          expect.any(String),
        ]);
      }
    }
    inspect(copy.fields!, expected, "pageCopy");
    for (const type of arSchemaTypes) expect(type.preview?.select).toBeTruthy();
  });
  it("accepts editorial dates with offsets and rejects ambiguous dates and blank text", () => {
    expect(
      validate("arSite", "approvedAt", "2026-10-03T07:00:00-05:00", {
        contentStatus: "approved",
      }),
    ).toEqual([true, true]);
    expect(
      validate("arSite", "approvedAt", undefined, {
        contentStatus: "approved",
      }),
    ).toEqual([true, expect.any(String)]);
    expect(
      validate("arSite", "sourceObservedAt", "2026-10-03T07:00:00"),
    ).toEqual([expect.any(String)]);
    expect(validate("arWorkshop", "title", " ")).toEqual([expect.any(String)]);
    expect(validate("arSite", "hero.text", " ")).toEqual([expect.any(String)]);
  });
  it("requires exact Lima timezone and ordered offset-aware edition instants", () => {
    expect(validate("arWorkshopEdition", "timeZone", "America/Lima")).toEqual([
      true,
    ]);
    expect(validate("arWorkshopEdition", "timeZone", "America/Bogota")).toEqual(
      [expect.any(String)],
    );
    expect(
      validate("arWorkshopEdition", "startsAt", "2026-10-10T10:00:00"),
    ).toEqual([expect.any(String)]);
    expect(
      validate("arWorkshopEdition", "endsAt", "2026-10-10T18:00:00-05:00", {
        startsAt: "2026-10-10T10:00:00-05:00",
      }),
    ).toEqual([true, true]);
    expect(
      validate("arWorkshopEdition", "endsAt", "2026-10-10T10:00:00-05:00", {
        startsAt: "2026-10-10T10:00:00-05:00",
      }),
    ).toEqual([true, expect.any(String)]);
  });
  it("requires supplied images to have asset and alt, and approved inspiration to have photograph rights", () => {
    expect(validate("arWorkshop", "image", undefined)).toEqual([true]);
    expect(validate("arWorkshop", "image", { alt: "Collar" })).toEqual([
      expect.any(String),
    ]);
    const image = {
      asset: { _ref: "image-example" },
      alt: "Collar",
      kind: "illustration",
      rightsConfirmed: false,
    };
    expect(
      validate("arInspiration", "image", image, {
        contentStatus: "pendingValidation",
      }),
    ).toEqual([true]);
    expect(
      validate("arInspiration", "image", image, { contentStatus: "approved" }),
    ).toEqual([expect.any(String)]);
    expect(
      validate(
        "arInspiration",
        "image",
        { ...image, kind: "photograph", rightsConfirmed: true },
        { contentStatus: "approved" },
      ),
    ).toEqual([true]);
  });
});
