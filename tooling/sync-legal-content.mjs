import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const sources = [
  ["terminos-y-condiciones", "Términos y condiciones", "terminos-de-uso.md"],
  ["privacidad", "Política de privacidad", "politica-de-privacidad.md"],
  ["cookies", "Política de cookies", "politica-de-cookies.md"],
  [
    "condiciones-comerciales",
    "Entregas, cancelaciones y devoluciones",
    "condiciones-comerciales.md",
  ],
];
const documents = sources.map(([slug, label, filename]) => {
  const markdown = readFileSync(
    new URL(`docs/legal/${filename}`, root),
    "utf8",
  ).replace(/\r\n/g, "\n");
  const title = markdown.match(/^# (.+)$/m)?.[1];
  if (!title) throw new Error(`Missing document title: ${filename}`);
  return { slug, label, title, markdown };
});
const output = new URL("apps/web/src/features/legal/documents.json", root);
const serialized = `${JSON.stringify(documents, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== serialized)
    throw new Error(
      "Legal content differs from docs/legal. Run npm run legal:sync.",
    );
  console.log("Legal content matches all four source documents.");
} else {
  writeFileSync(output, serialized);
  console.log(
    `Synced ${documents.length} legal drafts to ${fileURLToPath(output)}.`,
  );
}
