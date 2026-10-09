import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  arCraftsFixture,
  arCraftsConfig,
  publishedCraftQuery,
  previewCraftQuery,
} from "@ar-crafts/content";
const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  cached: undefined as unknown,
  createClient: vi.fn(),
  cacheOptions: undefined as unknown,
}));
vi.mock("server-only", () => ({}));
vi.mock("@sanity/client", () => ({
  createClient: mocks.createClient.mockImplementation(() => ({
    fetch: mocks.fetch,
  })),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (
    read: () => Promise<unknown>,
    keys: string[],
    options: unknown,
  ) => {
    mocks.cacheOptions = { keys, options };
    return async () => {
      try {
        mocks.cached = await read();
        return mocks.cached;
      } catch (error) {
        if (mocks.cached) return mocks.cached;
        throw error;
      }
    };
  },
}));
import { getCraftPageContent } from "./content-source";
beforeEach(() => {
  vi.stubEnv("SANITY_PROJECT_ID", "synthetic-ar");
  vi.stubEnv("SANITY_DATASET", "synthetic");
  vi.stubEnv("SANITY_READ_TOKEN", "synthetic-private-read-token");
});
afterEach(() => {
  vi.unstubAllEnvs();
  mocks.fetch.mockReset();
  mocks.cached = undefined;
  mocks.createClient.mockClear();
});
const approved = () => {
  const v = structuredClone(arCraftsFixture);
  v.site.contentStatus = "approved";
  v.site.approvedAt = "2026-10-03T12:00:00Z";
  v.workshops = [];
  v.materials = [];
  v.gallery = [];
  v.faq = [];
  return v;
};
describe("craft source failures and draft isolation", () => {
  it("uses the identified fixture without a CMS account", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "fixture");
    const content = await getCraftPageContent();
    expect(content.demo).toBe(true);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("renders an informative cold failure without demo offers", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    mocks.fetch.mockRejectedValue(new Error("secret headers"));
    const content = await getCraftPageContent();
    expect(content.unavailable).toBe(true);
    expect(content.workshops).toEqual([]);
    expect(content.contact.confirmed).toBe(false);
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });
  it("maps valid retained content from a synthetic cache double during an outage", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    vi.stubEnv("SANITY_PROJECT_ID", "synthetic-ar");
    vi.stubEnv("SANITY_DATASET", "synthetic");
    vi.stubEnv("SANITY_READ_TOKEN", "synthetic-private-read-token");
    mocks.fetch.mockResolvedValueOnce(approved());
    expect((await getCraftPageContent()).unavailable).toBe(false);
    mocks.fetch.mockRejectedValueOnce(new Error("offline"));
    expect((await getCraftPageContent()).unavailable).toBe(false);
  });
  it("never writes preview drafts into the published cache", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    vi.stubEnv("SANITY_PROJECT_ID", "synthetic-ar");
    vi.stubEnv("SANITY_DATASET", "synthetic");
    vi.stubEnv("SANITY_READ_TOKEN", "synthetic-private-read-token");
    mocks.fetch.mockResolvedValue(arCraftsFixture);
    expect((await getCraftPageContent(true)).workshops).toHaveLength(3);
    expect((await getCraftPageContent(false)).workshops).toEqual([]);
    expect(
      mocks.createClient.mock.calls.map(([options]) => options.perspective),
    ).toEqual(["drafts", "published"]);
    expect(mocks.fetch.mock.calls.map(([query]) => query)).toEqual([
      previewCraftQuery,
      publishedCraftQuery,
    ]);
  });
  it("uses actual configuration validation and sanitizes missing configuration", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    vi.stubEnv("SANITY_PROJECT_ID", "");
    expect((await getCraftPageContent()).unavailable).toBe(true);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("reads published content by default with server time and no CDN/request caching", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    vi.stubEnv("SANITY_PROJECT_ID", " synthetic-ar ");
    vi.stubEnv("SANITY_DATASET", " synthetic ");
    vi.stubEnv("SANITY_READ_TOKEN", " synthetic-private-read-token ");
    vi.stubEnv("NODE_ENV", "development");
    mocks.fetch.mockResolvedValue(approved());
    const before = Date.now();
    await getCraftPageContent();
    expect(mocks.createClient).toHaveBeenCalledWith({
      projectId: "synthetic-ar",
      dataset: "synthetic",
      token: "synthetic-private-read-token",
      apiVersion: "2026-09-18",
      useCdn: false,
      perspective: "published",
    });
    const [query, parameters, options] = mocks.fetch.mock.calls[0];
    expect(query).toBe(publishedCraftQuery);
    expect(Date.parse(parameters.now)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(parameters.now)).toBeLessThanOrEqual(Date.now());
    expect(options).toEqual({ cache: "no-store" });
    expect(mocks.cacheOptions).toEqual({
      keys: expect.arrayContaining(["ar-crafts-v1"]),
      options: { revalidate: arCraftsConfig.cacheSeconds, tags: ["ar-crafts"] },
    });
  });
  it("does not activate preview for fixtures", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "fixture");
    expect((await getCraftPageContent(true)).preview).toBe(false);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
