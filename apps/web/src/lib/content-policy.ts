import { isRemoteFixtureDemo } from "./deployment-policy";

export type ContentSource = "fixture" | "sanity";
export type SiteVisibility = "internal" | "public";

export function resolveContentPolicy({
  source,
  visibility,
  config,
  remoteDemo,
}: {
  source: string | undefined;
  visibility: string | undefined;
  config: { internalOnly: boolean; publishBlocked: boolean };
  remoteDemo?: string;
}): { source: ContentSource; visibility: SiteVisibility } {
  const resolvedSource = source?.trim() || "fixture";
  const resolvedVisibility = visibility?.trim() || "internal";
  if (
    remoteDemo !== undefined &&
    !isRemoteFixtureDemo(remoteDemo, source, visibility)
  )
    throw new Error(
      "Remote demo requires enabled mode, explicit fixture source and internal visibility",
    );
  if (resolvedSource !== "fixture" && resolvedSource !== "sanity")
    throw new Error(`Unsupported PATO_CONTENT_SOURCE: ${resolvedSource}`);
  if (resolvedVisibility !== "internal" && resolvedVisibility !== "public")
    throw new Error(`Unsupported PATO_SITE_VISIBILITY: ${resolvedVisibility}`);
  if (
    resolvedVisibility === "public" &&
    (config.internalOnly || config.publishBlocked)
  )
    throw new Error("Public release blocked by the client configuration");
  if (resolvedVisibility === "public" && resolvedSource === "fixture")
    throw new Error("Fixture content cannot be used for a public release");
  return { source: resolvedSource, visibility: resolvedVisibility };
}

/**
 * Local internal development is itself a protected preview surface: the proxy
 * only serves loopback hosts. Read drafts there without requiring every browser
 * profile to share Next.js' Draft Mode cookie.
 */
export function shouldReadDraftContent({
  draftModeEnabled,
  source,
  visibility,
  runtimeEnvironment,
}: {
  draftModeEnabled: boolean;
  source: string | undefined;
  visibility: string | undefined;
  runtimeEnvironment: string | undefined;
}): boolean {
  const usesSanity = source?.trim() === "sanity";
  const isInternal = (visibility?.trim() || "internal") === "internal";
  if (!usesSanity || !isInternal) return false;
  if (draftModeEnabled) return true;
  return runtimeEnvironment === "development" && usesSanity && isInternal;
}
