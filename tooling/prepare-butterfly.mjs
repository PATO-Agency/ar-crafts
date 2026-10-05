import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";

// Animate existing reflections; preserve the approved silhouettes, facets and settings.
const source = readFileSync("assets/butterfly-jewel.svg", "utf8");
const document = new JSDOM(source, { contentType: "image/svg+xml" }).window
  .document;
const svg = document.documentElement;
// Separate the original jewel from its beaded orbit without redrawing paths.
const body = document.getElementById("Group");
if (!body) throw new Error("Missing original butterfly group");
body.setAttribute("data-butterfly-body", "");
const orbit = document.createElementNS("http://www.w3.org/2000/svg", "g");
orbit.setAttribute("data-butterfly-orbit", "");
body.parentNode.insertBefore(orbit, body);
for (const node of [...body.parentNode.children]) {
  if (node === orbit || node === body) break;
  orbit.appendChild(node);
}
for (const [facet, setting, delay] of [
  ["Vector_115", "Vector_117", 1500],
  ["Vector_135", "Vector_137", 2800],
  ["Vector_180", "Vector_182", 4100],
]) {
  for (const [id, kind] of [
    [facet, "facet"],
    [setting, "setting"],
  ]) {
    const path = document.getElementById(id);
    if (!path) throw new Error(`Missing original jewel reflection ${id}`);
    path.setAttribute("data-glint", kind);
    path.setAttribute("style", `--glint-delay:${delay}ms`);
  }
}
const ids = new Map(
  [...svg.querySelectorAll("[id]")].map((el) => [
    el.id,
    `ar-butterfly-${el.id.replace(/[^a-z0-9_-]/gi, "-")}`,
  ]),
);
for (const element of svg.querySelectorAll("[id]"))
  element.id = ids.get(element.id);
let markup = svg.innerHTML;
markup = markup.replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${ids.get(id)})`);
writeFileSync(
  "apps/web/src/features/ar-crafts/butterfly-data.json",
  JSON.stringify({ markup }),
);
console.log(
  "Prepared original jewel SVG with three finite facet/setting glints.",
);
