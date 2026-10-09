import type { EditorialEnvironment } from "./config.ts";

export function editorialChildEnvironment(
  env: EditorialEnvironment,
  studio: boolean,
) {
  const child: Record<string, string | undefined> = { ...env };
  const publicStudioKeys = new Set([
    "SANITY_STUDIO_PROJECT_ID",
    "SANITY_STUDIO_DATASET",
    "SANITY_STUDIO_PREVIEW_URL",
    "SANITY_STUDIO_PREVIEW_ORIGIN",
    "SANITY_STUDIO_HOST",
    "SANITY_STUDIO_APP_ID",
  ]);
  for (const key of Object.keys(child)) {
    if (
      key.startsWith("AR_EDITORIAL_") ||
      key === "SANITY_WRITE_TOKEN" ||
      (studio && key.startsWith("SANITY_") && !publicStudioKeys.has(key)) ||
      (studio && key === "PATO_HOSTED_STUDIO_ORIGIN")
    )
      delete child[key];
  }
  return child;
}
