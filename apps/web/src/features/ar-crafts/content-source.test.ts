import { describe, expect, it, vi, afterEach } from "vitest";
import { arCraftsFixture } from "@ar-crafts/content";
const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  cached: undefined as unknown,
}));
vi.mock("server-only", () => ({}));
vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: mocks.fetch }),
}));
vi.mock("../../lib/sanity-configuration", () => ({
  readSanityConfiguration: () => ({
    projectId: "synthetic-ar",
    dataset: "synthetic",
    token: "synthetic",
  }),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (read: () => Promise<unknown>) => async () => {
    try {
      mocks.cached = await read();
      return mocks.cached;
    } catch (error) {
      if (mocks.cached) return mocks.cached;
      throw error;
    }
  },
}));
import { getCraftPageContent } from "./content-source";
afterEach(() => {
  vi.unstubAllEnvs();
  mocks.fetch.mockReset();
  mocks.cached = undefined;
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
  });
  it("can use valid published cache during a CMS outage", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    mocks.fetch.mockResolvedValueOnce(approved());
    expect((await getCraftPageContent()).unavailable).toBe(false);
    mocks.fetch.mockRejectedValueOnce(new Error("offline"));
    expect((await getCraftPageContent()).unavailable).toBe(false);
  });
  it("never writes preview drafts into the published cache", async () => {
    vi.stubEnv("AR_CONTENT_SOURCE", "sanity");
    mocks.fetch.mockResolvedValue(arCraftsFixture);
    expect((await getCraftPageContent(true)).workshops).toHaveLength(3);
    expect((await getCraftPageContent(false)).workshops).toEqual([]);
  });
});
