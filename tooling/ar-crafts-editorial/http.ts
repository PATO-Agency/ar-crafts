type EditorialTarget = { baseUrl: string; automationBypassSecret?: string };

/** Private headers are sent only to the configured origin; redirects are never followed. */
export function editorialHttp(
  target: EditorialTarget,
  transport: typeof fetch = fetch,
) {
  const allowed = new URL(target.baseUrl).origin;
  return async (
    input: string | URL,
    init: RequestInit = {},
    previewRedirect = false,
  ) => {
    let url: URL;
    try {
      url = new URL(input, allowed);
      if (url.origin !== allowed || url.username || url.password || url.hash)
        throw new Error();
    } catch {
      throw new Error("Editorial request target rejected.");
    }
    let response: Response;
    try {
      const headers = new Headers(init.headers);
      headers.delete("x-vercel-protection-bypass");
      if (target.automationBypassSecret)
        headers.set(
          "x-vercel-protection-bypass",
          target.automationBypassSecret,
        );
      response = await transport(url, { ...init, headers, redirect: "manual" });
    } catch {
      throw new Error(
        "Editorial request failed; private transport details withheld.",
      );
    }
    if (response.status >= 300 && response.status < 400) {
      try {
        const location = response.headers.get("location");
        if (!previewRedirect || response.status !== 307 || !location)
          throw new Error();
        const destination = new URL(location, url);
        if (
          destination.origin !== allowed ||
          destination.username ||
          destination.password ||
          destination.search ||
          destination.hash
        )
          throw new Error();
      } catch {
        throw new Error("Editorial redirect rejected.");
      }
    }
    return response;
  };
}
