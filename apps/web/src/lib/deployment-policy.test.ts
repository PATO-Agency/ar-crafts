import { describe, expect, it } from "vitest";
import { mayServeRequest } from "./deployment-policy";

describe("deployment exposure policy", () => {
  const remoteDemo = {
    hostnames: ["ar-crafts-demo.vercel.app"],
    visibility: "internal",
    hostedPreview: undefined,
    runtimeEnvironment: "production",
    localInternal: undefined,
    remoteDemo: "enabled",
    contentSource: "fixture",
    pathname: "/",
  };
  it.each([
    "/",
    "/robots.txt",
    "/sitemap.xml",
    "/_next/static/app.js",
    "/ar-crafts/butterfly-jewel.svg",
  ])("serves explicit fixture review path %s remotely", (pathname) => {
    expect(mayServeRequest({ ...remoteDemo, pathname })).toBe(true);
  });
  it.each([
    "/api",
    "/api/draft/enable",
    "/api/draft/disable",
    "/api/revalidate",
    "/unexpected",
  ])(
    "keeps technical and unknown paths unavailable in remote demo: %s",
    (pathname) => {
      expect(
        mayServeRequest({
          ...remoteDemo,
          pathname,
          hostedPreview: "authenticated",
        }),
      ).toBe(false);
    },
  );
  it.each([
    { remoteDemo: "true" },
    { contentSource: "sanity" },
    { contentSource: undefined },
    { visibility: "public" },
  ])(
    "rejects conflicting demo configuration even with another preview assertion: %j",
    (override) => {
      expect(
        mayServeRequest({
          ...remoteDemo,
          hostedPreview: "authenticated",
          ...override,
        }),
      ).toBe(false);
    },
  );
  it.each(["localhost", "localhost.", "127.0.0.1", "[::1]"])(
    "allows loopback development on %s",
    (hostname) => {
      expect(
        mayServeRequest({
          hostnames: [hostname],
          visibility: undefined,
          hostedPreview: undefined,
          runtimeEnvironment: "development",
          localInternal: undefined,
        }),
      ).toBe(true);
    },
  );

  it("denies an external host by default and in ordinary internal mode", () => {
    expect(
      mayServeRequest({
        hostnames: ["preview.example"],
        visibility: undefined,
        hostedPreview: undefined,
        runtimeEnvironment: "development",
        localInternal: undefined,
      }),
    ).toBe(false);
    expect(
      mayServeRequest({
        hostnames: ["preview.example"],
        visibility: "internal",
        hostedPreview: undefined,
        runtimeEnvironment: "development",
        localInternal: undefined,
      }),
    ).toBe(false);
  });

  it("requires an explicit authenticated-preview assertion for an internal external host", () => {
    expect(
      mayServeRequest({
        hostnames: ["preview.example"],
        visibility: "internal",
        hostedPreview: "true",
        runtimeEnvironment: "production",
        localInternal: undefined,
      }),
    ).toBe(false);
    expect(
      mayServeRequest({
        hostnames: ["preview.example"],
        visibility: "internal",
        hostedPreview: "authenticated",
        runtimeEnvironment: "production",
        localInternal: undefined,
      }),
    ).toBe(true);
  });

  it("allows an explicitly public host; the content policy applies the release gates", () => {
    expect(
      mayServeRequest({
        hostnames: ["food.example"],
        visibility: "public",
        hostedPreview: undefined,
        runtimeEnvironment: "production",
        localInternal: undefined,
      }),
    ).toBe(true);
  });

  it("fails closed for an unsupported visibility", () => {
    expect(
      mayServeRequest({
        hostnames: ["preview.example"],
        visibility: "private-ish",
        hostedPreview: "authenticated",
        runtimeEnvironment: "production",
        localInternal: "confirmed",
      }),
    ).toBe(false);
  });

  it("denies mixed proxy host assertions and accepts loopback ports", () => {
    expect(
      mayServeRequest({
        hostnames: ["127.0.0.1:3000", "preview.example"],
        visibility: "internal",
        hostedPreview: undefined,
        runtimeEnvironment: "production",
        localInternal: "confirmed",
      }),
    ).toBe(false);
    expect(
      mayServeRequest({
        hostnames: ["localhost:3000", "[::1]:3000"],
        visibility: "internal",
        hostedPreview: undefined,
        runtimeEnvironment: "production",
        localInternal: "confirmed",
      }),
    ).toBe(true);
  });

  it("fails closed for internal production unless local smoke mode is deliberate", () => {
    expect(
      mayServeRequest({
        hostnames: ["127.0.0.1:3000"],
        visibility: "internal",
        hostedPreview: undefined,
        runtimeEnvironment: "production",
        localInternal: undefined,
      }),
    ).toBe(false);
    expect(
      mayServeRequest({
        hostnames: ["127.0.0.1:3000"],
        visibility: "internal",
        hostedPreview: undefined,
        runtimeEnvironment: "production",
        localInternal: "confirmed",
      }),
    ).toBe(true);
  });
});
