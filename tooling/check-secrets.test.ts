import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve("tooling/check-secrets.mjs");
function scan(name: string, source: string) {
  const directory = resolve("tests/.generated");
  mkdirSync(directory, { recursive: true });
  const prefix = resolve(directory, "scanner-");
  const workspace = mkdtempSync(prefix);
  if (!workspace.startsWith(prefix)) throw new Error("Unsafe cleanup path");
  try {
    writeFileSync(resolve(workspace, name), source);
    return spawnSync(process.execPath, [script], {
      cwd: workspace,
      encoding: "utf8",
    });
  } finally {
    rmSync(workspace, { recursive: true });
  }
}
describe("secret scanner without Git", () => {
  it("accepts empty template variables on consecutive lines", () => {
    const result = scan(
      ".env.example",
      "SANITY_READ_TOKEN=\nSANITY_REVALIDATION_TOKEN=\nSANITY_PREVIEW_SECRET=\n",
    );
    expect(result.status).toBe(0);
  });
  it("rejects a populated token in a template", () => {
    const result = scan(
      ".env.example",
      `SANITY_READ_TOKEN = "${"x".repeat(24)}"`,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("potential credential detected");
  });
  it("rejects private environment files even without populated values", () => {
    const result = scan(".env.local", "SANITY_READ_TOKEN=\n");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("environment file must not be tracked");
  });
});
