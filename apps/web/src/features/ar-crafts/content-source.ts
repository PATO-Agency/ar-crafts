import "server-only";
import { createClient } from "@sanity/client";
import { unstable_cache } from "next/cache";
import {
  arCraftsConfig,
  arCraftsFixture,
  parseCraftContent,
  approvedCraftContent,
  publishedCraftQuery,
  previewCraftQuery,
} from "@ar-crafts/content";
import { readSanityConfiguration } from "../../lib/sanity-configuration";
import { resolveContentPolicy } from "../../lib/content-policy";
import { toCraftPageContent } from "./to-page-content";

async function fetchCrafts(preview: boolean) {
  const configuration = readSanityConfiguration(process.env);
  const client = createClient({
    ...configuration,
    apiVersion: "2026-09-18",
    useCdn: false,
    perspective: preview ? "drafts" : "published",
  });
  try {
    const content = parseCraftContent(
      await client.fetch(
        preview ? previewCraftQuery : publishedCraftQuery,
        { now: new Date().toISOString() },
        { cache: "no-store" },
      ),
    );
    const approved = approvedCraftContent(content, preview);
    if (!approved) throw new Error("Content has not been approved");
    return approved;
  } catch {
    throw new Error("AR Crafts CMS temporarily unavailable");
  }
}
const published = unstable_cache(
  () => fetchCrafts(false),
  [
    "ar-crafts-v1",
    process.env.SANITY_PROJECT_ID || "unconfigured",
    process.env.SANITY_DATASET || "unconfigured",
  ],
  { revalidate: arCraftsConfig.cacheSeconds, tags: ["ar-crafts"] },
);
export async function getCraftPageContent(preview = false) {
  const policy = resolveContentPolicy({
    source: process.env.AR_CONTENT_SOURCE,
    remoteDemo: process.env.AR_REMOTE_DEMO,
    visibility: process.env.PATO_SITE_VISIBILITY,
    config: arCraftsConfig,
  });
  preview =
    preview && policy.source === "sanity" && policy.visibility === "internal";
  if (policy.source === "fixture")
    return toCraftPageContent(arCraftsFixture, { demo: true, preview });
  try {
    return toCraftPageContent(
      await (preview ? fetchCrafts(true) : published()),
      { preview },
    );
  } catch {
    return toCraftPageContent(null, { preview, unavailable: true });
  }
}
