// Preserve exported paths, colors and direction; add only animation metadata.
import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";
const layouts = {};
const anchors = JSON.parse(
  readFileSync("design/botanical-anchors.json", "utf8"),
);
for (const width of [320, 390, 768, 1440]) {
  const xml = readFileSync(`assets/foliage/${width}.svg`, "utf8");
  const document = new JSDOM(xml, { contentType: "image/svg+xml" }).window
    .document;
  const root = document.documentElement.firstElementChild;
  const branches = [];
  let nodes = [];
  const finish = () => {
    if (!nodes.length) return;
    const ys = nodes.flatMap((node) =>
      [
        ...node.querySelectorAll("path"),
        ...(node.tagName === "path" ? [node] : []),
      ].flatMap((path) =>
        (path.getAttribute("d").match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [])
          .map(Number)
          .filter((_, index) => index % 2 === 1),
      ),
    );
    const top = Math.floor(Math.min(...ys) - 24),
      bottom = Math.ceil(Math.max(...ys) + 24);
    branches.push({
      width,
      offset: top - anchors[width][branches.length],
      height: bottom - top,
      viewBox: `0 ${top} ${width} ${bottom - top}`,
      markup: nodes.map((node) => node.outerHTML).join("\n"),
    });
    nodes = [];
  };
  for (const node of root.children) {
    const stem =
      node.tagName === "path" &&
      node.getAttribute("stroke") === "#6F7D49" &&
      Number(node.getAttribute("stroke-width")) >= 1.3 &&
      node.hasAttribute("stroke-linecap");
    if (stem) {
      finish();
      node.setAttribute("data-stem", "");
    } else {
      const path = node.tagName === "path" ? node : node.querySelector("path");
      if (!path) continue;
      const anchor = path
        .getAttribute("d")
        .match(/^M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
      if (anchor) {
        node.setAttribute("data-leaf", "");
        node.setAttribute("data-attach-x", anchor[1]);
        node.setAttribute("data-attach-y", anchor[2]);
      }
    }
    nodes.push(node);
  }
  finish();
  if (branches.length !== 7)
    throw new Error(`Expected seven branches at ${width}`);
  branches.forEach((branch, index) => {
    branch.markup = branch.markup
      .replace(/id="([^"]+)"/g, (_, id) => `id="ar-${width}-${index}-${id}"`)
      .replace(
        /url\(#([^)]*)\)/g,
        (_, id) => `url(#ar-${width}-${index}-${id})`,
      );
  });
  layouts[width] = branches;
}
writeFileSync(
  "apps/web/src/features/ar-crafts/botanical-data.json",
  JSON.stringify(layouts),
);
console.log("Prepared seven original branches for each of four layouts.");
