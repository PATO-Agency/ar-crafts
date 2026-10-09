import { describe, expect, it, vi } from "vitest";
import { editorialHttp } from "./http";

describe("editorial private transport", () => {
  const baseUrl = "https://editorial.example";
  const secret = "private-automation-test-value";
  it("attaches hosted bypass and forces manual redirects including webhook requests", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    const request = editorialHttp(
      { baseUrl, automationBypassSecret: secret },
      fetcher,
    );
    await request("/api/revalidate/sanity", {
      method: "POST",
      redirect: "follow",
      headers: { "sanity-webhook-signature": "private-signature" },
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const init = fetcher.mock.calls[0]![1]!;
    expect(init.redirect).toBe("manual");
    expect(new Headers(init.headers).get("x-vercel-protection-bypass")).toBe(
      secret,
    );
    expect(new Headers(init.headers).get("sanity-webhook-signature")).toBe(
      "private-signature",
    );
  });
  it("never sends caller bypass in local mode", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    await editorialHttp({ baseUrl: "http://127.0.0.1:3001" }, fetcher)("/", {
      headers: { "x-vercel-protection-bypass": secret },
    });
    expect(
      new Headers(fetcher.mock.calls[0]![1]!.headers).has(
        "x-vercel-protection-bypass",
      ),
    ).toBe(false);
  });
  it.each([
    "https://foreign.example/",
    "//foreign.example/",
    "https://user:password@editorial.example/",
  ])("blocks unsafe input before transport: %s", async (url) => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      editorialHttp({ baseUrl, automationBypassSecret: secret }, fetcher)(url),
    ).rejects.toThrow("target rejected");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    "https://foreign.example/",
    "//foreign.example/",
    "https://user:password@editorial.example/",
    "/?secret=private",
  ])(
    "rejects unsafe preview redirects without following: %s",
    async (location) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(null, { status: 307, headers: { location } }),
        );
      await expect(
        editorialHttp({ baseUrl, automationBypassSecret: secret }, fetcher)(
          "/api/draft/enable",
          {},
          true,
        ),
      ).rejects.toThrow("redirect rejected");
      expect(fetcher).toHaveBeenCalledOnce();
    },
  );
  it("accepts expected same-origin preview redirects but rejects page/webhook redirects", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(null, { status: 307, headers: { location: "/" } }),
      );
    const request = editorialHttp({ baseUrl }, fetcher);
    expect((await request("/api/draft/enable", {}, true)).status).toBe(307);
    await expect(request("/")).rejects.toThrow("redirect rejected");
    await expect(
      request("/api/revalidate/sanity", { method: "POST" }),
    ).rejects.toThrow("redirect rejected");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("redacts private network errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error(secret));
    await expect(
      editorialHttp(
        { baseUrl, automationBypassSecret: secret },
        fetcher,
      )("/?secret=preview-private"),
    ).rejects.toThrow("private transport details withheld");
  });
  it("redacts invalid private header values before sending", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      editorialHttp(
        { baseUrl, automationBypassSecret: secret + "\r\nprivate" },
        fetcher,
      )("/"),
    ).rejects.toThrow("private transport details withheld");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
