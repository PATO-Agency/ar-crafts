import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
// @ts-expect-error Deployment preparation is a directly executable JavaScript module.
import {
  demoProjectId,
  includeEditorialPath,
  parseArguments,
  prepareEditorial,
} from "./prepare-vercel-editorial.mjs";

const roots: string[] = [];
const visualNames = [
  "page-view.tsx",
  "motion.tsx",
  "motion-math.ts",
  "theme.css",
  "botanical-data.json",
  "butterfly-data.json",
];
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "editorial-stage-"));
  roots.push(root);
  const put = (path: string, value = "fixture") => {
    const destination = resolve(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, value);
  };
  for (const path of [
    "package.json",
    "package-lock.json",
    "tsconfig.base.json",
    ".gitignore",
    ".vercelignore",
    "packages/content/index.ts",
    "examples/ar-crafts/index.ts",
  ])
    put(path);
  for (const name of visualNames)
    put(`apps/web/src/features/ar-crafts/${name}`, name);
  put(
    "apps/web/vercel.json",
    JSON.stringify({ env: { AR_REMOTE_DEMO: "enabled" } }),
  );
  put(
    "config/vercel.ar-crafts-editorial.json",
    readFileSync(resolve("config/vercel.ar-crafts-editorial.json"), "utf8"),
  );
  for (const path of [
    "apps/web/.env.example",
    "packages/content/.env.private",
    "apps/web/node_modules/dependency.js",
    "apps/web/.next/build.js",
    "apps/web/.vercel/project.json",
    "apps/web/public/demo/private.png",
    "apps/web/docs/private.md",
    "apps/web/plans/private.md",
  ])
    put(path, "excluded");
  return { root, put, output: "docs/delivery/006-editorial/test-stage" };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe("independent editorial staging", () => {
  it("defaults to read-only inventory and reports the exact staged config override", () => {
    const { root, output } = fixture();
    const result = prepareEditorial({ root, output });
    expect(existsSync(resolve(root, output))).toBe(false);
    expect(result.mode).toBe("dry-run");
    expect(result.target).toBeNull();
    expect(
      result.files.some((file: { path: string }) => file.path.includes(".env")),
    ).toBe(false);
    expect(result.configOverride.sourceSha256).not.toBe(
      result.configOverride.stagedSha256,
    );
    expect(result.command).toContain("--local-config");
  });

  it("writes a fresh independent tree with unchanged visual sources, full hashes and explicit target", () => {
    const { root, output } = fixture();
    const sourceConfig = readFileSync(
      resolve(root, "apps/web/vercel.json"),
      "utf8",
    );
    const result = prepareEditorial({
      root,
      output,
      write: true,
      projectId: "prj_editorialTest",
      orgId: "team_editorialTest",
    });
    const stage = resolve(root, output);
    expect(readFileSync(resolve(root, "apps/web/vercel.json"), "utf8")).toBe(
      sourceConfig,
    );
    expect(existsSync(resolve(root, ".vercel"))).toBe(false);
    expect(
      JSON.parse(readFileSync(resolve(stage, ".vercel/project.json"), "utf8")),
    ).toEqual({ projectId: "prj_editorialTest", orgId: "team_editorialTest" });
    const config = JSON.parse(
      readFileSync(resolve(stage, "apps/web/vercel.json"), "utf8"),
    );
    expect(config.env.AR_CONTENT_SOURCE).toBe("sanity");
    expect(config.env).not.toHaveProperty("AR_REMOTE_DEMO");
    expect(config.env).not.toHaveProperty("PATO_HOSTED_INTERNAL_PREVIEW");
    for (const file of result.files)
      expect(digest(readFileSync(resolve(stage, file.path), "utf8"))).toBe(
        file.sha256,
      );
    for (const name of visualNames) {
      const path = `apps/web/src/features/ar-crafts/${name}`;
      expect(readFileSync(resolve(stage, path))).toEqual(
        readFileSync(resolve(root, path)),
      );
    }
    expect(
      JSON.parse(
        readFileSync(resolve(stage, "editorial-upload-manifest.json"), "utf8"),
      ).configOverride,
    ).toEqual(result.configOverride);
    expect(existsSync(resolve(stage, "apps/web/public/demo"))).toBe(false);
    expect(existsSync(resolve(stage, "apps/web/.vercel"))).toBe(false);
  });

  it("rejects demo, partial targets, unsafe destinations and existing output before writes", () => {
    const { root, output } = fixture();
    expect(() =>
      prepareEditorial({
        root,
        output,
        write: true,
        projectId: demoProjectId,
        orgId: "team_test",
      }),
    ).toThrow("demo project");
    expect(() =>
      prepareEditorial({ root, output, write: true, projectId: "prj_test" }),
    ).toThrow("explicit valid");
    expect(() => prepareEditorial({ root, write: true })).toThrow(
      "explicit --output",
    );
    expect(() =>
      prepareEditorial({ root, output: "apps/web", write: true }),
    ).toThrow("new child");
    expect(() =>
      prepareEditorial({
        root,
        output: "docs/delivery/006-editorial/../escape",
        write: true,
      }),
    ).toThrow("new child");
    mkdirSync(resolve(root, output), { recursive: true });
    expect(() => prepareEditorial({ root, output, write: true })).toThrow(
      "never overwritten",
    );
  });

  it("rejects private flags in editorial config before reserving output", () => {
    const { root, output, put } = fixture();
    put(
      "config/vercel.ar-crafts-editorial.json",
      JSON.stringify({
        env: {
          AR_CONTENT_SOURCE: "sanity",
          PATO_SITE_VISIBILITY: "internal",
          AR_REMOTE_DEMO: "",
        },
      }),
    );
    expect(() => prepareEditorial({ root, output, write: true })).toThrow(
      "only sanity/internal",
    );
    expect(existsSync(resolve(root, output))).toBe(false);
  });

  it("filters private paths in either platform spelling and parses explicit flags", () => {
    for (const path of [
      "apps\\web\\.env.local",
      "apps/web/.env.example",
      "apps/web/.vercel/project.json",
      "apps/web/public/demo/old.jpg",
      "packages/content/dist/a.js",
      "examples/ar-crafts/tooling/a.js",
    ])
      expect(includeEditorialPath(path)).toBe(false);
    expect(includeEditorialPath("apps/web/public/ar-crafts/gallery.jpg")).toBe(
      true,
    );
    expect(
      parseArguments([
        "--output",
        "docs/delivery/006-editorial/run",
        "--write",
        "--project-id",
        "prj_test",
        "--org-id",
        "team_test",
      ]),
    ).toEqual({
      output: "docs/delivery/006-editorial/run",
      write: true,
      projectId: "prj_test",
      orgId: "team_test",
    });
    expect(() => parseArguments(["--output", "--write"])).toThrow(
      "Missing value",
    );
    expect(() => parseArguments(["--token", "private"])).toThrow(
      "Unknown argument",
    );
  });
});
