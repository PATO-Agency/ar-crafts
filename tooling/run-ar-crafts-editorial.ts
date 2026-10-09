import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { editorialChildEnvironment } from "./ar-crafts-editorial/runner-env.ts";
import {
  editorialConfiguration,
  inspectEditorialEnvironment,
} from "./ar-crafts-editorial/config.ts";

function run() {
  const mode = process.argv[2] || "diagnose";
  if (mode === "diagnose") {
    console.log(
      JSON.stringify(inspectEditorialEnvironment(process.env), null, 2),
    );
  } else {
    const config = editorialConfiguration(process.env);
    if (config.mode === "hosted" && (mode === "web" || mode === "start"))
      throw new Error("Hosted web runs at the protected provider origin.");
    const deployStudio = mode === "studio-deploy" || mode === "studio-dry-run";
    if (deployStudio) {
      const host = process.env.SANITY_STUDIO_HOST;
      if (
        config.mode !== "hosted" ||
        !host ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(host) ||
        config.hostedStudioOrigin !== `https://${host}.sanity.studio`
      )
        throw new Error("Configure an exact hosted Studio target first.");
    }
    const commands: Record<string, [string, string[]]> = {
      web: [
        "apps/web",
        [
          "../../node_modules/next/dist/bin/next",
          "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3001",
        ],
      ],
      start: [
        "apps/web",
        [
          "../../node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3001",
        ],
      ],
      build: ["apps/web", ["../../node_modules/next/dist/bin/next", "build"]],
      studio: [
        "apps/studio",
        [
          "../../node_modules/sanity/bin/sanity",
          "dev",
          "--host",
          "127.0.0.1",
          "--port",
          "3334",
        ],
      ],
      "studio-build": [
        "apps/studio",
        ["../../node_modules/sanity/bin/sanity", "build"],
      ],
      "studio-deploy": [
        "apps/studio",
        [
          "../../node_modules/sanity/bin/sanity",
          "deploy",
          "--yes",
          "--json",
          "--schema-required",
        ],
      ],
      "studio-dry-run": [
        "apps/studio",
        [
          "../../node_modules/sanity/bin/sanity",
          "deploy",
          "--yes",
          "--json",
          "--schema-required",
          "--dry-run",
        ],
      ],
    };
    if (!Object.hasOwn(commands, mode))
      throw new Error(
        "Use diagnose, web, start, build, studio, studio-build, studio-dry-run or studio-deploy.",
      );
    const [cwd, args] = commands[mode]!;
    if (deployStudio) args.push("--title", "AR Crafts — Contenido de prueba");
    // These vars are inherited only by this child, not the demo configuration.
    const child = spawn(process.execPath, args, {
      cwd: resolve(cwd),
      env: editorialChildEnvironment(process.env, mode.startsWith("studio")),
      stdio: "inherit",
    });
    child.on("error", () => {
      console.error("Editorial process could not start.");
      process.exitCode = 1;
    });
    child.on("exit", (code) => {
      process.exitCode = code ?? 1;
    });
  }
}
try {
  run();
} catch {
  console.error(
    "Editorial configuration incomplete or invalid. Run diagnose and follow the CMS runbook; private values withheld.",
  );
  process.exitCode = 1;
}
