// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { arCraftsFixture } from "@ar-crafts/content";
import { CraftPageView } from "./page-view";
import { toCraftPageContent } from "./to-page-content";
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img src={String(props.src)} alt={String(props.alt)} />
  ),
}));
it("omits optional sections and anchors when content is missing", () => {
  const markup = renderToStaticMarkup(
    <CraftPageView content={toCraftPageContent(null, { unavailable: true })} />,
  );
  expect(markup).not.toContain('href="#galeria"');
  expect(markup).not.toContain('href="#sobre-adriana"');
  expect(markup).not.toContain('href="#preguntas"');
  expect(markup).toContain("No hay próximos talleres publicados");
  expect(markup).not.toContain("wa.me");
});
it("orders the first three narrative stages and keeps extra images in flow", () => {
  const fixture = structuredClone(arCraftsFixture);
  fixture.gallery = [
    fixture.gallery[2],
    fixture.gallery[0],
    fixture.gallery[1],
    ...Array.from({ length: 5 }, (_, i) => ({
      ...fixture.gallery[0],
      id: `extra-${i}`,
    })),
  ];
  const model = toCraftPageContent(fixture, { demo: true });
  expect(model.gallery.slice(0, 3).map((v) => v.step)).toEqual([
    "piece",
    "detail",
    "hands",
  ]);
  const markup = renderToStaticMarkup(<CraftPageView content={model} />);
  const document = new DOMParser().parseFromString(markup, "text/html");
  expect(document.querySelectorAll(".inspiration-slide")).toHaveLength(3);
  expect(document.querySelectorAll(".gallery-extra figure")).toHaveLength(5);
  expect(
    document
      .querySelector(".inspiration-scene")
      ?.getAttribute("data-scene-eligible"),
  ).toBe("true");
  expect(
    document.querySelector("[aria-hidden=true].inspiration-slide"),
  ).toBeNull();
});
