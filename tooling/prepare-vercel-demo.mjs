import {
  cpSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { resolve, basename, relative } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const evidence = resolve(root, "docs/delivery/vercel-demo-2026-10-05");
const stage = resolve(evidence, "staging");
mkdirSync(stage, { recursive: true });
const ignored = new Set([
  "node_modules",
  ".next",
  "dist",
  ".sanity",
  ".vercel",
  "tsconfig.tsbuildinfo",
]);
const filter = (source) => {
  const name = basename(source);
  const path = relative(root, source).replaceAll("\\", "/");
  return (
    !ignored.has(name) &&
    !name.startsWith(".env") &&
    path !== "apps/web/public/demo" &&
    !name.endsWith(".log")
  );
};
for (const path of [
  "package.json",
  "package-lock.json",
  "tsconfig.base.json",
  ".gitignore",
  ".vercelignore",
  "apps",
  "packages",
  "examples",
]) {
  cpSync(resolve(root, path), resolve(stage, path), {
    recursive: true,
    filter,
  });
}
const hash = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
const inventory = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? inventory(path) : [path];
  });
const files = inventory(stage).map((path) => ({
  path: relative(stage, path).replaceAll("\\", "/"),
  sha256: hash(path),
}));
if (
  files.some(
    (file) =>
      file.path.split("/").some((part) => part.startsWith(".env")) ||
      file.path.startsWith("apps/web/public/demo/"),
  )
)
  throw new Error("Excluded private/legacy asset detected");
const visual = [
  "page-view.tsx",
  "motion.tsx",
  "motion-math.ts",
  "theme.css",
  "botanical-data.json",
  "butterfly-data.json",
].map((file) => `apps/web/src/features/ar-crafts/${file}`);
for (const path of visual)
  if (hash(resolve(root, path)) !== hash(resolve(stage, path)))
    throw new Error(`Source mismatch ${path}`);
writeFileSync(
  resolve(evidence, "upload-manifest.json"),
  JSON.stringify(
    {
      stage,
      files,
      visualSourcesIdentical: visual,
      lockSha256: hash(resolve(root, "package-lock.json")),
      excluded:
        "Private env files, build/dependency trees, evidence, source design assets and VicaFoods public assets; workspace library/example sources retained for type compilation",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    stage,
    files: files.length,
    visualSourcesIdentical: visual.length,
    privateEnvFiles: 0,
  }),
);
