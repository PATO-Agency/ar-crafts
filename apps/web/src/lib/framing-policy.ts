const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function trustedStudioOrigin(value: string | undefined) {
  const configured = value?.trim();
  if (!configured) return undefined;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("PATO_STUDIO_ORIGIN must be an absolute origin");
  }

  const isHttps = url.protocol === "https:";
  const isLocalHttp =
    url.protocol === "http:" && loopbackHosts.has(url.hostname);
  if (
    (!isHttps && !isLocalHttp) ||
    url.username ||
    url.password ||
    url.hostname.includes("*") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    ![url.origin, `${url.origin}/`].includes(configured)
  )
    throw new Error(
      "PATO_STUDIO_ORIGIN must be an exact HTTPS origin or loopback HTTP origin",
    );

  return url.origin;
}

export function trustedHostedStudioOrigin(value: string | undefined) {
  const trustedOrigin = trustedStudioOrigin(value);
  if (!trustedOrigin) return undefined;
  const url = new URL(trustedOrigin);
  if (url.protocol !== "https:" || url.port || loopbackHosts.has(url.hostname))
    throw new Error(
      "PATO_HOSTED_STUDIO_ORIGIN must be an exact HTTPS origin without a port",
    );
  return trustedOrigin;
}

export function frameAncestorsDirective(
  studioOrigin: string | undefined,
  hostedStudioOrigin?: string,
) {
  const hostedOrigin = trustedHostedStudioOrigin(hostedStudioOrigin);
  const origins = [
    ...new Set(
      [
        trustedStudioOrigin(studioOrigin),
        hostedOrigin,
        // Hosted Studio is embedded by the Sanity organization dashboard.
        hostedOrigin ? "https://www.sanity.io" : undefined,
      ].filter((origin) => origin !== undefined),
    ),
  ];
  return `frame-ancestors 'self'${origins.length ? ` ${origins.join(" ")}` : ""}`;
}
