type ProviderHook = {
  dataset?: string;
  url?: string;
  isDisabledByUser?: boolean;
  isDisabled?: boolean;
  rule?: { on?: string[] };
  filter?: string;
  projection?: string;
  includeDrafts?: boolean;
};

/** Explicit allowlist: management hook responses can contain signing credentials. */
export function webhookDiagnostics(
  hook: ProviderHook | undefined,
  expectedDataset: string,
) {
  const operatorDisabled =
    typeof hook?.isDisabledByUser === "boolean" ? hook.isDisabledByUser : null;
  const serviceDisabled =
    typeof hook?.isDisabled === "boolean" ? hook.isDisabled : null;
  const disabled =
    operatorDisabled === true || serviceDisabled === true
      ? true
      : operatorDisabled === false && serviceDisabled === false
        ? false
        : null;
  let destinationIsProvisionalDemo = false;
  if (hook?.url) {
    try {
      const url = new URL(hook.url);
      destinationIsProvisionalDemo =
        url.hostname === "ar-crafts-demo.vercel.app" &&
        url.pathname === "/api/revalidate/sanity";
    } catch {
      // Malformed/private destinations are not copied into diagnostic evidence.
    }
  }
  return {
    found: Boolean(hook),
    datasetMatches: hook?.dataset === expectedDataset,
    operatorDisabled,
    serviceDisabled,
    disabled,
    destinationIsProvisionalDemo,
    events: Array.isArray(hook?.rule?.on)
      ? hook.rule.on.filter((event) =>
          ["create", "update", "delete"].includes(event),
        )
      : [],
    filterConfigured: Boolean(hook?.filter),
    projectionConfigured: Boolean(hook?.projection),
    includeDrafts:
      typeof hook?.includeDrafts === "boolean" ? hook.includeDrafts : null,
  };
}
