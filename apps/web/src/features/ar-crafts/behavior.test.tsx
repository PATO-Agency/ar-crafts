// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { arCraftsFixture } from "@ar-crafts/content";
import { createWhatsAppClickPayload } from "@pato-food/analytics";
import { MaterialsSection } from "./materials-section";
import { CraftPageView } from "./page-view";
import { contactUrl } from "./contact-link";
import { toCraftPageContent } from "./to-page-content";
import { branchProgress, sceneTimeline } from "./motion-math";
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img alt={String(props.alt)} src={String(props.src)} />
  ),
}));
vi.mock("./motion", () => ({ CraftMotion: () => null }));
afterEach(cleanup);
const content = toCraftPageContent(arCraftsFixture, { demo: true });
describe("craft behavior", () => {
  it("renders editorial section copy and multiline headings while retaining omitted defaults", () => {
    const pageCopy = {
      hero: {
        mobileEyebrow: "CREAMOS CONTIGO",
        secondary: "Crea un recuerdo",
        scrollCue: "Descubre la colección",
      },
      journeys: {
        eyebrow: "TU SIGUIENTE PROYECTO",
        title: "Elige tu camino",
        workshop: {
          title: "Aprende\ncon Adriana",
          text: "Técnicas para empezar",
        },
        materials: {
          title: "Elige tus cuentas",
          text: "Materiales para tu proyecto",
        },
      },
      workshops: {
        eyebrow: "NUEVOS TALLERES",
        title: "Creamos\njuntos",
        text: "Explora los talleres disponibles",
      },
      materials: {
        eyebrow: "INSUMOS ARTESANALES",
        title: "Tu selección\nde materiales",
        text: "Encuentra tus próximos colores",
      },
      about: { eyebrow: "NUESTRA HISTORIA", title: "Crear con intención" },
      inspiration: {
        eyebrow: "IDEAS PARA CREAR",
        title: "Nuestra inspiración",
        text: "Una mirada al proceso",
        stories: {
          piece: "El inicio de una pieza",
          detail: "El cuidado de cada detalle",
          hands: "Manos que crean",
        },
      },
      faq: {
        eyebrow: "TE ACOMPAÑAMOS",
        title: "Resolvemos tus dudas",
        text: "Lo que necesitas saber",
      },
      contact: {
        eyebrow: "CONVERSEMOS",
        title: "Cuéntanos tu idea",
        text: "Consulta con Adriana",
      },
      footer: { text: "Creado con cariño\nAR Crafts" },
    };
    const edited = toCraftPageContent(
      { ...arCraftsFixture, site: { ...arCraftsFixture.site, pageCopy } },
      { demo: true },
    );
    expect(edited.pageCopy).toEqual(pageCopy);
    const { container } = render(<CraftPageView content={edited} />);
    for (const text of [
      "Crea un recuerdo",
      "Descubre la colección",
      "TU SIGUIENTE PROYECTO",
      "Elige tu camino",
      "Técnicas para empezar",
      "Elige tus cuentas",
      "Materiales para tu proyecto",
      "NUEVOS TALLERES",
      "Explora los talleres disponibles",
      "INSUMOS ARTESANALES",
      "Encuentra tus próximos colores",
      "NUESTRA HISTORIA",
      "Crear con intención",
      "IDEAS PARA CREAR",
      "Nuestra inspiración",
      "Una mirada al proceso",
      "El inicio de una pieza",
      "El cuidado de cada detalle",
      "Manos que crean",
      "TE ACOMPAÑAMOS",
      "Resolvemos tus dudas",
      "Lo que necesitas saber",
      "CONVERSEMOS",
      "Cuéntanos tu idea",
      "Consulta con Adriana",
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(container.querySelector("#workshops-title")?.innerHTML).toBe(
      "Creamos<br>juntos",
    );
    expect(container.querySelector("#materials-title")?.innerHTML).toBe(
      "Tu selección<br>de materiales",
    );
    expect(container.querySelector(".journey-card h3")?.innerHTML).toBe(
      "Aprende<br>con Adriana",
    );
    expect(container.querySelector(".site-footer p")?.innerHTML).toBe(
      "Creado con cariño<br>AR Crafts",
    );
    expect(screen.getByText(arCraftsFixture.site.about!.text)).toBeTruthy();
    expect(screen.getByText("CREAMOS CONTIGO")).toBeTruthy();
  });
  it("preserves legacy section defaults and their exact line breaks without page copy", () => {
    const { container } = render(<CraftPageView content={content} />);
    expect(content.pageCopy).toBeUndefined();
    expect(
      renderToStaticMarkup(
        <CraftPageView content={{ ...content, demo: false }} />,
      ),
    ).toContain("Versión de revisión · sin publicación comercial.");
    expect(screen.getByText("CREA · APRENDE · INSPÍRATE")).toBeTruthy();
    expect(container.querySelector("#workshops-title")?.innerHTML).toBe(
      "Tu creatividad,<br>cuenta por cuenta.",
    );
    expect(container.querySelector("#materials-title")?.innerHTML).toBe(
      "Cada detalle abre<br>una posibilidad.",
    );
    expect(container.querySelector("#faq-title")?.innerHTML).toBe(
      "Toda creación<br>empieza con una pregunta.",
    );
    expect(screen.getByText("Ideas que florecen.")).toBeTruthy();
    expect(
      screen.getByText("Una forma de la naturaleza se convierte en una pieza."),
    ).toBeTruthy();
    expect(
      screen.getByText("Pequeños detalles. Infinitas posibilidades."),
    ).toBeTruthy();
  });
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
    expect(sceneTimeline(-900, 1000).index).toBe(2);
    expect(sceneTimeline(-100, 1000).index).toBe(0);
  });
});

describe("gallery timeline", () => {
  it.each([
    [0, 0],
    [0.08, 0],
    [0.2595, 0],
    [0.26, 1],
    [0.2605, 1],
    [0.28, 1],
    [0.48, 1],
    [0.68, 1],
    [0.7195, 1],
    [0.72, 2],
    [0.7205, 2],
    [0.9, 2],
    [1, 2],
  ])(
    "selects the visually dominant stage at %s (including incoming ties)",
    (progress, index) => {
      const timeline = sceneTimeline(-progress * 1000, 1000);
      expect(timeline.progress).toBeCloseTo(progress, 10);
      expect(timeline.index).toBe(index);
    },
  );

  it("clamps outside the journey and normalizes zero travel", () => {
    expect(sceneTimeline(100, 1000)).toEqual({
      progress: 0,
      reveals: [1, 0, 0],
      scales: [1, 1.16, 1.16],
      index: 0,
    });
    const end = sceneTimeline(-2000, 1000);
    expect(end.progress).toBe(1);
    expect(end.reveals).toEqual([1, 1, 1]);
    expect(end.index).toBe(2);
    end.scales.forEach((scale) => expect(scale).toBeCloseTo(16 / 15, 10));
    expect(sceneTimeline(0, 0).progress).toBe(0);
    expect(sceneTimeline(-0.28, 0).progress).toBe(0.28);
    expect(sceneTimeline(-0.28, 0).index).toBe(1);
    expect(sceneTimeline(-2, 0).progress).toBe(1);
  });

  it.each([
    [0.28, [1, 4 / 7, 0], [1.056, 187 / 175, 1.16]],
    [0.68, [1, 1, 5 / 14], [16 / 15, 16 / 15, 2902 / 2625]],
  ])(
    "preserves partial masks and the original zoom at %s",
    (progress, reveals, scales) => {
      const timeline = sceneTimeline(-progress * 1000, 1000);
      timeline.reveals.forEach((reveal, i) =>
        expect(reveal).toBeCloseTo(reveals[i], 10),
      );
      timeline.scales.forEach((scale, i) =>
        expect(scale).toBeCloseTo(scales[i], 10),
      );
    },
  );

  it("returns identical timelines at the same position after reversals and large jumps", () => {
    const forward = [0, 0.2595, 0.26, 0.28, 0.68, 0.7195, 0.72, 0.9, 1];
    const snapshots = new Map(
      forward.map((p) => [p, sceneTimeline(-p * 1000, 1000)]),
    );
    for (const p of [...forward].reverse().concat([1, 0, 0.68, 0.28, 1, 0])) {
      expect(sceneTimeline(-p * 1000, 1000)).toEqual(snapshots.get(p));
    }
  });

  it.each([1 / 3, 2 / 3])(
    "keeps zoom continuous across the old third at %s",
    (boundary) => {
      const before = sceneTimeline(-(boundary - 0.0005) * 1000, 1000);
      const after = sceneTimeline(-(boundary + 0.0005) * 1000, 1000);
      expect(after.index).toBe(before.index);
      after.scales.forEach((scale, i) =>
        expect(Math.abs(scale - before.scales[i])).toBeLessThan(0.001),
      );
      expect(sceneTimeline(-(boundary - 0.0005) * 1000, 1000)).toEqual(before);
    },
  );
});
