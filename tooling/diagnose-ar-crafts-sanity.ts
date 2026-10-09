import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@sanity/client";
import { editorialConfiguration } from "./ar-crafts-editorial/config.ts";
import { webhookDiagnostics } from "./ar-crafts-editorial/webhook-diagnostics.ts";

// Read-only provider preflight. Never serialize clients, responses or errors:
// management responses can contain webhook credentials and private user data.
async function main() {
  const config = editorialConfiguration(process.env);
  const report: Record<string, unknown> = {
    createdAt: new Date().toISOString(),
    operations: "read-only",
    writesAttempted: false,
    projectMatchesStudio: true,
    datasetMatchesStudio: true,
  };
  const client = (token: string) =>
    createClient({
      projectId: config.projectId,
      dataset: config.dataset,
      apiVersion: "2026-09-18",
      useCdn: false,
      token,
      maxRetries: 0,
      timeout: 10000,
    });
  const manager = client(config.writeToken).withConfig({
    useProjectHostname: false,
  });
  let failed = false;
  async function check(name: string, action: () => Promise<unknown>) {
    try {
      report[name] = { success: true, result: await action() };
    } catch (error) {
      failed = true;
      const err = error as {
        statusCode?: number;
        code?: string;
        cause?: { code?: string };
      };
      const rawCode = err.cause?.code || err.code;
      report[name] = {
        success: false,
        status: typeof err.statusCode === "number" ? err.statusCode : null,
        networkCode: rawCode && /^[A-Z_]{2,32}$/.test(rawCode) ? rawCode : null,
      };
    }
  }
  await Promise.all([
    check("publishedRead", async () => ({
      documentCount: await client(config.readToken).fetch<number>(
        "count(*[_type in $types])",
        {
          types: [
            "arSite",
            "arWorkshop",
            "arWorkshopEdition",
            "arMaterial",
            "arInspiration",
            "arFaq",
          ],
        },
        { perspective: "published" },
      ),
    })),
    check("draftsRead", async () => ({
      documentCount: await client(config.readToken).fetch<number>(
        "count(*[_type in $types])",
        {
          types: [
            "arSite",
            "arWorkshop",
            "arWorkshopEdition",
            "arMaterial",
            "arInspiration",
            "arFaq",
          ],
        },
        { perspective: "drafts" },
      ),
    })),
    check("dataset", async () => {
      const data = await manager.datasets.list();
      const dataset = data.find((entry) => entry.name === config.dataset);
      return {
        found: Boolean(dataset),
        private: dataset?.aclMode === "private",
      };
    }),
    check("project", async () => {
      const project = await manager.projects.getById(config.projectId);
      return {
        matches: project.id === config.projectId,
        memberCount: project.members?.length ?? null,
      };
    }),
    check("cors", async () => {
      const data = await manager.request<{
        origins: Array<{ origin: string; allowCredentials?: boolean }>;
      }>({
        uri: `/projects/${config.projectId}/cors`,
        method: "GET",
      });
      const origins = Array.isArray(data) ? data : data.origins;
      return {
        studioExactWithCredentials:
          origins?.some(
            (entry) =>
              entry.origin === config.studioOrigin &&
              entry.allowCredentials === true,
          ) ?? false,
        hostedStudioExactWithCredentials: config.hostedStudioOrigin
          ? (origins?.some(
              (entry) =>
                entry.origin === config.hostedStudioOrigin &&
                entry.allowCredentials === true,
            ) ?? false)
          : null,
        wildcardPresent:
          origins?.some((entry) => entry.origin.includes("*")) ?? false,
      };
    }),
    check("webhook", async () => {
      const hooks = await manager.request<
        Array<{
          id: string;
          url?: string;
          dataset?: string;
          isDisabled?: boolean;
          isDisabledByUser?: boolean;
          rule?: { on?: string[] };
          filter?: string;
          projection?: string;
          includeDrafts?: boolean;
        }>
      >({ uri: `/hooks/projects/${config.projectId}`, method: "GET" });
      const hook = hooks.find(
        (entry) => entry.id === process.env.SANITY_WEBHOOK_ID,
      );
      return webhookDiagnostics(hook, config.dataset);
    }),
  ]);
  const argument = process.argv.find((arg) => arg.startsWith("--report="));
  if (argument) {
    const path = resolve(argument.slice("--report=".length));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(report, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch(() => {
  console.error("AR Sanity preflight failed; private details withheld.");
  process.exitCode = 1;
});
