// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { arCraftsFixture } from "@ar-crafts/content";
import { createWhatsAppClickPayload } from "@pato-food/analytics";
import { MaterialsSection } from "./materials-section";
import { contactUrl } from "./contact-link";
import { toCraftPageContent } from "./to-page-content";
import { branchProgress, sceneState } from "./motion-math";
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img alt={String(props.alt)} src={String(props.src)} />
  ),
}));
afterEach(cleanup);
const content = toCraftPageContent(arCraftsFixture, { demo: true });
describe("craft behavior", () => {
  it.each([0, 6, 12])(
    "shows a disclosure only for more than six materials (%s)",
    (count) => {
      const materials = Array.from({ length: count }, (_, i) => ({
        ...content.materials[0],
        id: `material-${i}`,
        title: `Material ${i}`,
      }));
      if (materials.length) {
        materials[0].title = "Nombre de material demostrativo "
          .repeat(5)
          .slice(0, 120);
        materials[0].presentationLabel =
          "Presentación demostrativa con detalles de formato y acabado "
            .repeat(4)
            .slice(0, 160);
      }
      mkdirSync("tests/.generated", { recursive: true });
      writeFileSync(
        `tests/.generated/materials-${count}.html`,
        renderToStaticMarkup(
          <MaterialsSection
            materials={materials}
            contact={{ confirmed: false }}
          />,
        ),
      );
      render(
        <MaterialsSection
          materials={materials}
          contact={{ confirmed: false }}
        />,
      );
      expect(screen.queryAllByRole("article")).toHaveLength(count);
      const disclosure = screen.queryByText(
        `Ver todos los materiales (${count})`,
      );
      expect(Boolean(disclosure)).toBe(count > 6);
      if (disclosure) {
        const details = disclosure.closest("details")!;
        details.open = true;
        fireEvent(details, new Event("toggle"));
        expect(details.open).toBe(true);
      }
    },
  );
  it("does not generate WhatsApp URLs until confirmed; preserves accents when confirmed", () => {
    expect(contactUrl({ confirmed: false }, "Hola, pedrería")).toBeNull();
    const href = contactUrl(
      { confirmed: true, destinationE164: "+15555550100" },
      "Hola, pedrería y macramé",
    );
    expect(new URL(href!).searchParams.get("text")).toBe(
      "Hola, pedrería y macramé",
    );
    expect(
      toCraftPageContent(
        {
          ...arCraftsFixture,
          site: {
            ...arCraftsFixture.site,
            contact: { confirmed: true, destinationE164: "+15555550100" },
          },
        },
        { demo: true },
      ).contact.confirmed,
    ).toBe(false);
  });
  it("handles empty content, hidden materials and expired editions without offers", () => {
    const model = toCraftPageContent(
      {
        ...arCraftsFixture,
        materials: [{ ...arCraftsFixture.materials[0], status: "hidden" }],
        editions: [
          {
            ...arCraftsFixture.workshops[0],
            workshopId: "miyuki",
            startsAt: "2026-10-10T10:00:00-05:00",
            endsAt: "2026-10-10T18:00:00-05:00",
            timeZone: "America/Lima",
          },
        ],
      },
      { demo: true, now: new Date("2026-10-10T23:00:00Z") },
    );
    expect(model.materials).toEqual([]);
    expect(model.workshops[0].dateLabel).toBe("Próxima fecha por confirmar");
    expect(model.workshops[0].priceLabel).toBe("Consultar precio");
    expect(toCraftPageContent(null, { unavailable: true }).workshops).toEqual(
      [],
    );
  });
  it("projects journey without phone, URL, message or arbitrary values", () => {
    const payload = createWhatsAppClickPayload({
      cta_location: "menu",
      intent: "inquiry",
      site_key: "ar-crafts",
      journey: "material",
      phone: "private",
      message: "private",
      url: "private",
    } as never);
    expect(payload).toEqual({
      cta_location: "menu",
      intent: "inquiry",
      site_key: "ar-crafts",
      journey: "material",
      page_path: "/",
    });
    expect(
      createWhatsAppClickPayload({
        cta_location: "footer",
        intent: "inquiry",
        site_key: "ar-crafts",
        journey: "free text",
      } as never)?.journey,
    ).toBeUndefined();
  });
  it("branches and inspiration follow current position in both directions", () => {
    const grown = branchProgress(-300, 200, 900);
    expect(branchProgress(500, 200, 900)).toBeLessThan(grown);
    expect(branchProgress(1000, 200, 900)).toBe(0);
    expect(branchProgress(-1500, 200, 900)).toBe(1);
    expect(sceneState(-900, 1000, 3)).toBe(2);
    expect(sceneState(-100, 1000, 3)).toBe(0);
  });
});
