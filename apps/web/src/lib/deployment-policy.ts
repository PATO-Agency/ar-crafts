import { legalPaths } from "../features/legal/links";

const loopbackHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

export function isRemoteFixtureDemo(
  remoteDemo: string | undefined,
  source: string | undefined,
  visibility: string | undefined,
) {
  return (
    remoteDemo?.trim() === "enabled" &&
    source?.trim() === "fixture" &&
    (visibility?.trim() || "internal") === "internal"
  );
}

function normalizeHostname(authority: string): string {
  let hostname = authority.trim().toLowerCase();
  if (hostname.startsWith("[")) {
    const closingBracket = hostname.indexOf("]");
    if (closingBracket > 0) hostname = hostname.slice(1, closingBracket);
  } else if ((hostname.match(/:/g) ?? []).length === 1) {
    hostname = hostname.split(":", 1)[0] ?? hostname;
  }
  return hostname.replace(/\.$/, "");
}

export function mayServeRequest({
  hostnames,
  visibility,
  hostedPreview,
  runtimeEnvironment,
  localInternal,
  remoteDemo,
  contentSource,
  pathname,
}: {
  hostnames: string[];
  visibility: string | undefined;
  hostedPreview: string | undefined;
  runtimeEnvironment: string | undefined;
  localInternal: string | undefined;
  remoteDemo?: string;
  contentSource?: string;
  pathname?: string;
}): boolean {
  const resolvedVisibility = visibility?.trim() || "internal";
  // Server configuration enables fixture review, legal drafts and public assets.
  // This branch precedes other exposure modes so conflicts fail closed.
  if (remoteDemo !== undefined) {
    if (!isRemoteFixtureDemo(remoteDemo, contentSource, visibility))
      return false;
    return (
      !!pathname &&
      (["/", "/robots.txt", "/sitemap.xml", "/favicon.ico"].includes(
        pathname,
      ) ||
        legalPaths.includes(pathname.replace(/\/$/, "")) ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/ar-crafts/"))
    );
  }
  if (resolvedVisibility === "public") return true;
  if (
    resolvedVisibility === "internal" &&
    hostedPreview?.trim() === "authenticated"
  )
    return true;
  if (resolvedVisibility !== "internal") return false;
  if (
    runtimeEnvironment !== "development" &&
    localInternal?.trim() !== "confirmed"
  )
    return false;
  const assertedHostnames = hostnames.filter((hostname) => hostname.trim());
  return (
    assertedHostnames.length > 0 &&
    assertedHostnames.every((hostname) =>
      loopbackHostnames.has(normalizeHostname(hostname)),
    )
  );
}
