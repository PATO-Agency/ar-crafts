export type EditorialEnvironment = Readonly<Record<string, string | undefined>>;

export function inspectEditorialEnvironment(env: EditorialEnvironment) {
  const required = [
    "SANITY_PROJECT_ID",
    "SANITY_DATASET",
    "SANITY_READ_TOKEN",
    "SANITY_WRITE_TOKEN",
    "SANITY_REVALIDATION_TOKEN",
    "SANITY_WEBHOOK_SECRET",
    "SANITY_PREVIEW_SECRET",
    "SANITY_WEBHOOK_ID",
    "SANITY_STUDIO_PROJECT_ID",
    "SANITY_STUDIO_DATASET",
    "SANITY_STUDIO_PREVIEW_URL",
    "PATO_STUDIO_ORIGIN",
  ] as const;
  const mode = env.AR_EDITORIAL_MODE ?? "local";
  const keys: readonly string[] =
    mode === "hosted"
      ? [
          ...required,
          "AR_EDITORIAL_ALLOWED_ORIGIN",
          "AR_EDITORIAL_AUTOMATION_BYPASS_SECRET",
        ]
      : required;
  return {
    mode,
    configured: Object.fromEntries(
      keys.map((key) => [key, Boolean(env[key]?.trim())]),
    ),
    missing: keys.filter((key) => !env[key]?.trim()),
    projectMatchesStudio: Boolean(
      env.SANITY_PROJECT_ID &&
      env.SANITY_PROJECT_ID === env.SANITY_STUDIO_PROJECT_ID,
    ),
    datasetMatchesStudio: Boolean(
      env.SANITY_DATASET && env.SANITY_DATASET === env.SANITY_STUDIO_DATASET,
    ),
    fixtureDemoConflict: env.AR_REMOTE_DEMO !== undefined,
    hostedAuthenticationVerified: false,
  };
}

export function editorialConfiguration(env: EditorialEnvironment) {
  const projectId = env.SANITY_PROJECT_ID?.trim();
  const dataset = env.SANITY_DATASET?.trim();
  if (
    !projectId ||
    !/^[a-z0-9-]+$/.test(projectId) ||
    projectId === "localdemo"
  )
    throw new Error("Configure an authorized AR Crafts project ID.");
  if (dataset !== "ar-crafts-editorial-test")
    throw new Error(
      "This harness requires the isolated ar-crafts-editorial-test dataset.",
    );
  if (
    env.SANITY_STUDIO_PROJECT_ID?.trim() !== projectId ||
    env.SANITY_STUDIO_DATASET?.trim() !== dataset
  )
    throw new Error(
      "Studio and web must use the same authorized AR project/dataset.",
    );
  if (
    env.AR_CONTENT_SOURCE !== "sanity" ||
    env.PATO_SITE_VISIBILITY !== "internal" ||
    env.AR_REMOTE_DEMO !== undefined
  )
    throw new Error(
      "Editorial profile must be internal Sanity with AR_REMOTE_DEMO absent.",
    );
  const mode = env.AR_EDITORIAL_MODE ?? "local";
  if (mode !== "local" && mode !== "hosted")
    throw new Error("Select local or hosted editorial mode.");
  if (mode === "local" && env.PATO_HOSTED_INTERNAL_PREVIEW !== undefined)
    throw new Error(
      "The local harness does not verify hosted authentication; omit the hosted assertion.",
    );
  if (
    mode === "local" &&
    (env.PATO_LOCAL_INTERNAL !== "confirmed" ||
      env.AR_EDITORIAL_ALLOWED_ORIGIN !== undefined ||
      env.AR_EDITORIAL_AUTOMATION_BYPASS_SECRET !== undefined)
  )
    throw new Error("Explicit local internal confirmation is required.");
  if (!env.SANITY_WEBHOOK_ID?.trim())
    throw new Error("Configure the AR-only webhook ID.");
  const origin = (value: string | undefined) => {
    try {
      const url = new URL(value || "");
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        ![url.origin, url.origin + "/"].includes(value || "")
      )
        throw new Error();
      return url;
    } catch {
      throw new Error("Use exact editorial origins without private URL data.");
    }
  };
  const baseUrl = origin(env.SANITY_STUDIO_PREVIEW_URL);
  const studio = origin(env.PATO_STUDIO_ORIGIN);
  const hostedStudio = env.PATO_HOSTED_STUDIO_ORIGIN?.trim()
    ? origin(env.PATO_HOSTED_STUDIO_ORIGIN)
    : undefined;
  if (
    hostedStudio &&
    (mode !== "hosted" ||
      hostedStudio.protocol !== "https:" ||
      hostedStudio.port ||
      hostedStudio.hostname.includes("*") ||
      ["localhost", "127.0.0.1", "[::1]"].includes(hostedStudio.hostname))
  )
    throw new Error(
      "Hosted Studio requires an exact HTTPS origin without a port in hosted mode.",
    );
  if (mode === "hosted") {
    const allowed = origin(env.AR_EDITORIAL_ALLOWED_ORIGIN);
    if (
      env.PATO_LOCAL_INTERNAL !== undefined ||
      env.PATO_HOSTED_INTERNAL_PREVIEW !== "authenticated" ||
      allowed.protocol !== "https:" ||
      allowed.port ||
      ["localhost", "127.0.0.1", "[::1]", "ar-crafts-demo.vercel.app"].includes(
        allowed.hostname,
      ) ||
      allowed.origin !== baseUrl.origin
    )
      throw new Error(
        "Hosted mode requires the explicit protected editorial HTTPS origin.",
      );
  }
  for (const url of mode === "local" ? [baseUrl, studio] : [studio]) {
    if (
      url.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      throw new Error(
        "Use exact loopback HTTP origins for the isolated editorial profile.",
      );
  }
  if ((mode === "local" && baseUrl.port !== "3001") || studio.port !== "3334")
    throw new Error(
      "Use editorial web port 3001 and Studio port 3334, separate from the demo.",
    );
  const token = (name: string, minimum = 24) => {
    const value = env[name]?.trim();
    if (!value || value.length < minimum)
      throw new Error(`${name} is missing or invalid.`);
    return value;
  };
  return {
    mode,
    automationBypassSecret:
      mode === "hosted"
        ? token("AR_EDITORIAL_AUTOMATION_BYPASS_SECRET", 1)
        : undefined,
    projectId,
    dataset,
    baseUrl: baseUrl.origin,
    studioOrigin: studio.origin,
    hostedStudioOrigin: hostedStudio?.origin,
    readToken: token("SANITY_READ_TOKEN"),
    writeToken: token("SANITY_WRITE_TOKEN"),
    receiptToken: token("SANITY_REVALIDATION_TOKEN"),
    webhookSecret: token("SANITY_WEBHOOK_SECRET", 32),
    previewSecret: token("SANITY_PREVIEW_SECRET", 32),
  };
}
