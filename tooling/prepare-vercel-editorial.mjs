import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const demoProjectId = "prj_U62JHvgScNgATxwNBmx5vRoGVj47";
const editorialConfig = "config/vercel.ar-crafts-editorial.json";
const allowed = [
  "package.json",
  "package-lock.json",
  "tsconfig.base.json",
  ".gitignore",
  ".vercelignore",
  "apps",
  "packages",
  "examples",
  editorialConfig,
];
const excludedNames = new Set([
  "node_modules",
  ".next",
  "dist",
  ".sanity",
  ".vercel",
  ".git",
  ".codex",
  ".agents",
  ".impeccable",
  ".turbo",
  "docs",
  "plans",
  "tooling",
  "tests",
  "coverage",
  "test-results",
  "playwright-report",
  "assets",
  "design",
  "previews",
]);
const visualSources = [
  "page-view.tsx",
  "motion.tsx",
  "motion-math.ts",
  "theme.css",
  "botanical-data.json",
  "butterfly-data.json",
].map((name) => `apps/web/src/features/ar-crafts/${name}`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const portable = (path) => path.split(sep).join("/");

function isWithin(parent, child) {
  const path = relative(parent, child);
  return (
    path !== "" &&
    !isAbsolute(path) &&
    path !== ".." &&
    !path.startsWith(`..${sep}`)
  );
}

export function includeEditorialPath(path) {
  const parts = path.replaceAll("\\", "/").split("/");
  return (
    !parts.some((part) => excludedNames.has(part) || part.startsWith(".env")) &&
    !path.replaceAll("\\", "/").startsWith("apps/web/public/demo/") &&
    path.replaceAll("\\", "/") !== "apps/web/public/demo" &&
    !/\.(?:log|tsbuildinfo|md)$/i.test(path) &&
    !/\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(path)
  );
}

function targetLink(projectId, orgId) {
  if (!projectId && !orgId) return undefined;
  if (
    !/^prj_[A-Za-z0-9]+$/.test(projectId || "") ||
    !/^team_[A-Za-z0-9]+$/.test(orgId || "")
  )
    throw new Error("Link requires explicit valid --project-id and --org-id");
  if (projectId === demoProjectId)
    throw new Error("Editorial staging cannot target the demo project");
  return { projectId, orgId };
}

/** Defaults to a read-only inventory. Writing requires a new, explicit output. */
export function prepareEditorial({
  root = process.cwd(),
  output,
  write = false,
  projectId,
  orgId,
} = {}) {
  root = resolve(root);
  const link = targetLink(projectId, orgId);
  if (write && !output)
    throw new Error("Writing requires an explicit --output");
  const destination = output ? resolve(root, output) : undefined;
  const outputParent = resolve(root, "docs/delivery/006-editorial");
  if (destination && !isWithin(outputParent, destination))
    throw new Error(
      "Output must be a new child of docs/delivery/006-editorial",
    );
  if (destination && existsSync(destination))
    throw new Error("Output already exists; staging is never overwritten");
  if (destination) {
    let ancestor = dirname(destination);
    while (ancestor !== root) {
      if (existsSync(ancestor) && lstatSync(ancestor).isSymbolicLink())
        throw new Error("Output ancestors must not be symlinks");
      ancestor = dirname(ancestor);
    }
  }

  const files = [];
  const visit = (path) => {
    if (!includeEditorialPath(path)) return;
    const absolute = resolve(root, path);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink())
      throw new Error(`Staging refuses symlinks: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute).sort())
        visit(portable(relative(root, resolve(absolute, name))));
      return;
    }
    if (!stat.isFile()) throw new Error(`Unsupported source: ${path}`);
    files.push({ path, source: absolute, bytes: readFileSync(absolute) });
  };
  for (const path of allowed) visit(path);
  const config = files.find((file) => file.path === editorialConfig);
  const parsedConfig = JSON.parse(config.bytes.toString("utf8"));
  for (const env of [parsedConfig.env, parsedConfig.build?.env]) {
    if (
      env?.AR_CONTENT_SOURCE !== "sanity" ||
      env?.PATO_SITE_VISIBILITY !== "internal" ||
      Object.keys(env).some(
        (key) => !["AR_CONTENT_SOURCE", "PATO_SITE_VISIBILITY"].includes(key),
      )
    )
      throw new Error(
        "Editorial configuration must contain only sanity/internal flags",
      );
  }
  const original = files.find((file) => file.path === "apps/web/vercel.json");
  if (!original)
    throw new Error("Demo configuration missing from source inventory");
  const override = {
    path: original.path,
    sourceSha256: hash(original.bytes),
    stagedSha256: hash(config.bytes),
    replacement: editorialConfig,
  };
  original.bytes = config.bytes;
  for (const path of visualSources)
    if (!files.some((file) => file.path === path))
      throw new Error(`Approved visual source missing: ${path}`);
  const manifest = {
    version: 1,
    mode: write ? "written" : "dry-run",
    rootDirectory: "apps/web",
    sourceFilesOutsideRootDirectory: true,
    nodeVersion: "22.x",
    target: link || null,
    configOverride: override,
    files: files.map((file) => ({ path: file.path, sha256: hash(file.bytes) })),
    visualSourcesIdentical: visualSources,
    excluded:
      "All environment files, provider links, dependencies/build output, private evidence/plans, tooling/tests, original design assets, and legacy demo assets",
    command: destination
      ? [
          "vercel",
          "deploy",
          "--cwd",
          destination,
          "--local-config",
          resolve(destination, editorialConfig),
          "--prod",
        ]
      : null,
    prerequisites:
      "Verify installed CLI help, target project settings and All Deployments protection before deployment; supply private project environment separately",
  };
  if (write) {
    // No deletion or reuse: reserve a new directory only after the complete inventory validates.
    mkdirSync(dirname(destination), { recursive: true });
    mkdirSync(destination);
    for (const file of files) {
      const path = resolve(destination, file.path);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.bytes, { flag: "wx" });
    }
    if (link) {
      mkdirSync(resolve(destination, ".vercel"));
      writeFileSync(
        resolve(destination, ".vercel/project.json"),
        JSON.stringify(link, null, 2) + "\n",
        { flag: "wx" },
      );
    }
    for (const file of files)
      if (
        hash(readFileSync(resolve(destination, file.path))) !== hash(file.bytes)
      )
        throw new Error(`Staged hash mismatch: ${file.path}`);
    writeFileSync(
      resolve(destination, "editorial-upload-manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
      { flag: "wx" },
    );
  }
  return manifest;
}

export function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--write") options.write = true;
    else if (["--output", "--project-id", "--org-id"].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${arg}`);
      options[
        {
          "--output": "output",
          "--project-id": "projectId",
          "--org-id": "orgId",
        }[arg]
      ] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const result = prepareEditorial(parseArguments(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Editorial preparation failed",
    );
    process.exitCode = 1;
  }
}
