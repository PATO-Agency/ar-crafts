import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ draftMode: vi.fn(), disable: vi.fn() }));
vi.mock("next/headers", () => ({
  draftMode: mocks.draftMode,
}));
import { GET } from "./route";

describe("GET /api/draft/disable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
  });
  afterEach(() => vi.unstubAllEnvs());
  it("exits draft mode and returns privately to the public root", async () => {
    const response = await GET(
      new Request(
        "https://preview.example/api/draft/disable?redirect=https://attacker.example",
      ),
    );
    expect(mocks.draftMode).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://preview.example/");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
  it("expires manual and Presentation cookies in their separate storage keys", async () => {
    const response = await GET(
      new Request("https://preview.example/api/draft/disable"),
    );
    const expiries = response.headers.getSetCookie();
    expect(expiries).toHaveLength(2);
    expect(
      expiries.filter((cookie) => /; Partitioned(?:;|$)/i.test(cookie)),
    ).toHaveLength(1);
    // A browser keys CHIPS cookies by the current top-level site as well as host/path/name.
    // The ordinary expiry alone (Next's default) cannot delete a partitioned cookie.
    const stored = new Map([
      ["ordinary", "manual-draft-cookie"],
      ["partition:current-site", "presentation-draft-cookie"],
      ["partition:another-site", "other-context-draft-cookie"],
    ]);
    for (const expiry of expiries) {
      expect(expiry).toContain("__prerender_bypass=;");
      expect(expiry).toContain("Path=/");
      expect(expiry).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
      expect(expiry).toContain("Max-Age=0");
      expect(expiry).toContain("HttpOnly");
      expect(expiry).toContain("SameSite=None");
      expect(expiry).toContain("Secure");
      stored.delete(
        /; Partitioned(?:;|$)/i.test(expiry)
          ? "partition:current-site"
          : "ordinary",
      );
    }
    expect([...stored.keys()]).toEqual(["partition:another-site"]);
    expect(mocks.draftMode).not.toHaveBeenCalled();
  });
  it("keeps loopback exit usable without an invalid insecure Partitioned cookie", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await GET(
      new Request("http://127.0.0.1:3001/api/draft/disable"),
    );
    const expiries = response.headers.getSetCookie();
    expect(expiries).toHaveLength(1);
    expect(expiries[0]).toContain("SameSite=Lax");
    expect(expiries[0]).not.toContain("Secure");
    expect(expiries[0]).not.toContain("Partitioned");
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3001/");
  });
});
