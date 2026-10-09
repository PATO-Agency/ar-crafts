import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  draftMode: vi.fn(),
  cookies: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  validatePresentation: vi.fn(),
}));
vi.mock("next/headers", () => ({
  draftMode: mocks.draftMode,
  cookies: mocks.cookies,
}));
vi.mock("../../../../lib/presentation-preview", () => ({
  validatePresentationPreview: mocks.validatePresentation,
}));
import { GET } from "./route";

function request(host = "preview.example", query = "") {
  return new Request(`https://${host}/api/draft/enable${query}`);
}
function assertPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
}

describe("GET /api/draft/enable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SANITY_PREVIEW_SECRET", "s".repeat(32));
    mocks.draftMode.mockResolvedValue({ enable: mocks.enable });
    mocks.cookies.mockResolvedValue({
      get: mocks.getCookie,
      set: mocks.setCookie,
    });
    mocks.getCookie.mockReturnValue({
      name: "__prerender_bypass",
      value: "draft-cookie",
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["", "?secret=wrong", "?secret="])(
    "rejects unauthorized manual preview %s",
    async (query) => {
      const response = await GET(request("preview.example", query));
      expect(response.status).toBe(401);
      expect(mocks.draftMode).not.toHaveBeenCalled();
      expect(mocks.setCookie).not.toHaveBeenCalled();
      assertPrivate(response);
    },
  );
  it("rejects an absent or short configured manual secret", async () => {
    for (const secret of ["", "short"]) {
      vi.stubEnv("SANITY_PREVIEW_SECRET", secret);
      expect(
        (await GET(request("preview.example", `?secret=${secret}`))).status,
      ).toBe(401);
    }
  });
  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "allows loopback %s only during development",
    async (host) => {
      expect((await GET(request(host))).status).toBe(401);
      vi.stubEnv("NODE_ENV", "development");
      const response = await GET(request(host));
      expect(response.status).toBe(307);
      expect(mocks.setCookie).toHaveBeenCalledWith(
        "__prerender_bypass",
        "draft-cookie",
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          partitioned: false,
          maxAge: 1800,
          path: "/",
        },
      );
      assertPrivate(response);
    },
  );
  it("rejects non-loopback development hosts", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await GET(request("localhost.attacker.example"))).status).toBe(401);
  });
  it.each([
    "/",
    "//attacker.example",
    "https://attacker.example",
    "/api/revalidate/sanity",
    "/\\attacker.example",
    "/\r\nLocation:bad",
  ])("keeps the manual redirect safe for %s", async (redirect) => {
    const query = new URLSearchParams({ secret: "s".repeat(32), redirect });
    const response = await GET(request("preview.example", `?${query}`));
    expect(response.headers.get("location")).toBe("https://preview.example/");
    expect(mocks.enable).toHaveBeenCalledOnce();
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "__prerender_bypass",
      "draft-cookie",
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        partitioned: false,
        maxAge: 1800,
        path: "/",
      },
    );
    assertPrivate(response);
  });
  it.each(["production", "development"])(
    "accepts a validated Presentation secret in %s",
    async (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      mocks.validatePresentation.mockResolvedValue({
        isValid: true,
        redirectTo: "//attacker.example",
      });
      const req = request(
        "preview.example",
        "?sanity-preview-secret=ephemeral&redirect=/api/draft/disable",
      );
      const response = await GET(req);
      expect(mocks.validatePresentation).toHaveBeenCalledWith(req.url);
      expect(mocks.enable).toHaveBeenCalledOnce();
      expect(response.headers.get("location")).toBe("https://preview.example/");
      expect(mocks.setCookie).toHaveBeenCalledWith(
        "__prerender_bypass",
        "draft-cookie",
        {
          httpOnly: true,
          secure: environment === "production",
          sameSite: environment === "production" ? "none" : "lax",
          partitioned: environment === "production",
          maxAge: 3600,
          path: "/",
        },
      );
      assertPrivate(response);
    },
  );
  it.each([false, "throw"])(
    "fails closed when Presentation validation returns %s",
    async (result) => {
      if (result === "throw")
        mocks.validatePresentation.mockRejectedValue(
          new Error("private upstream failure"),
        );
      else mocks.validatePresentation.mockResolvedValue({ isValid: false });
      const response = await GET(
        request("preview.example", "?sanity-preview-secret=invalid"),
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Preview unauthorized or not configured",
      });
      expect(mocks.enable).not.toHaveBeenCalled();
      assertPrivate(response);
    },
  );
});
