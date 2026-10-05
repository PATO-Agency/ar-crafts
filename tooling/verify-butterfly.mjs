import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const original = new JSDOM(readFileSync("assets/butterfly-jewel.svg", "utf8"), {
  contentType: "image/svg+xml",
}).window.document;
const artwork = JSON.parse(
  readFileSync("apps/web/src/features/ar-crafts/butterfly-data.json", "utf8"),
);
const prepared = new JSDOM(
  `<svg xmlns="http://www.w3.org/2000/svg">${artwork.markup}</svg>`,
  { contentType: "image/svg+xml" },
).window.document;
const namespace = (id) => `ar-butterfly-${id.replace(/[^a-z0-9_-]/gi, "-")}`;
let compared = 0;
for (const path of original.querySelectorAll("path[id]")) {
  const copy = prepared.getElementById(namespace(path.id));
  if (!copy) throw new Error(`Missing original path ${path.id}`);
  for (const attr of [
    "d",
    "fill",
    "stroke",
    "stroke-width",
    "opacity",
    "transform",
  ]) {
    const expected =
      path
        .getAttribute(attr)
        ?.replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${namespace(id)})`) ??
      null;
    if (copy.getAttribute(attr) !== expected)
      throw new Error(`Changed original path ${path.id}, attribute ${attr}`);
  }
  compared++;
}
console.log(
  `Preserved original path geometry/fill/stroke/opacity/transform: ${compared}`,
);
console.log(
  `Marked original glints: ${prepared.querySelectorAll("[data-glint]").length}`,
);
