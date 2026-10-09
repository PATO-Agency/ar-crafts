import { describe, expect, it } from "vitest";
import { editorialConfiguration, inspectEditorialEnvironment } from "./config";

const configured = () => ({
  SANITY_PROJECT_ID: "synthetic-ar",
  SANITY_STUDIO_PROJECT_ID: "synthetic-ar",
  SANITY_DATASET: "ar-crafts-editorial-test",
  SANITY_STUDIO_DATASET: "ar-crafts-editorial-test",
  AR_CONTENT_SOURCE: "sanity",
  PATO_SITE_VISIBILITY: "internal",
  PATO_LOCAL_INTERNAL: "confirmed",
  SANITY_WEBHOOK_ID: "synthetic-hook",
  SANITY_STUDIO_PREVIEW_URL: "http://127.0.0.1:3001",
  PATO_STUDIO_ORIGIN: "http://127.0.0.1:3334",
  SANITY_READ_TOKEN: "r".repeat(32),
  SANITY_WRITE_TOKEN: "w".repeat(32),
  SANITY_REVALIDATION_TOKEN: "v".repeat(32),
  SANITY_WEBHOOK_SECRET: "s".repeat(32),
  SANITY_PREVIEW_SECRET: "p".repeat(32),
});

const hosted = () => ({
  ...configured(),
  AR_EDITORIAL_MODE: "hosted",
  PATO_LOCAL_INTERNAL: undefined,
  PATO_HOSTED_INTERNAL_PREVIEW: "authenticated",
  SANITY_STUDIO_PREVIEW_URL: "https://editorial.example",
  AR_EDITORIAL_ALLOWED_ORIGIN: "https://editorial.example",
  AR_EDITORIAL_AUTOMATION_BYPASS_SECRET: "test-" + "x".repeat(32),
});
describe("explicit hosted editorial isolation", () => {
  it("adds hosted Studio while preserving local Studio and protected preview", () => {
    const config = editorialConfiguration({
      ...hosted(),
      PATO_HOSTED_STUDIO_ORIGIN: "https://ar-editor.sanity.studio/",
    });
    expect(config.hostedStudioOrigin).toBe("https://ar-editor.sanity.studio");
    expect(config.studioOrigin).toBe("http://127.0.0.1:3334");
    expect(config.baseUrl).toBe("https://editorial.example");
    expect(() =>
      editorialConfiguration({
        ...configured(),
        PATO_HOSTED_STUDIO_ORIGIN: "https://ar-editor.sanity.studio",
      }),
    ).toThrow();
  });

  it.each([
    "http://ar-editor.sanity.studio",
    "https://ar-editor.sanity.studio:8443",
    "https://user:password@ar-editor.sanity.studio",
    "https://*.sanity.studio",
    "https://ar-editor.sanity.studio/path",
    "https://ar-editor.sanity.studio?token=value",
    "https://ar-editor.sanity.studio#",
    "https://ar-editor.sanity.studio/../",
    "https://localhost",
  ])("rejects unsafe hosted Studio configuration %s", (value) => {
    expect(() =>
      editorialConfiguration({ ...hosted(), PATO_HOSTED_STUDIO_ORIGIN: value }),
    ).toThrow();
  });
  it("accepts an exact protected origin while keeping local Studio and isolated dataset", () => {
    const config = editorialConfiguration(hosted());
    expect(config.mode).toBe("hosted");
    expect(config.baseUrl).toBe("https://editorial.example");
    expect(config.studioOrigin).toBe("http://127.0.0.1:3334");
    const diagnostic = inspectEditorialEnvironment(hosted());
    expect(diagnostic.hostedAuthenticationVerified).toBe(false);
    expect(JSON.stringify(diagnostic)).not.toContain(
      hosted().AR_EDITORIAL_AUTOMATION_BYPASS_SECRET,
    );
  });
  it.each([
    { AR_EDITORIAL_MODE: "unknown" },
    { AR_EDITORIAL_ALLOWED_ORIGIN: undefined },
    { AR_EDITORIAL_AUTOMATION_BYPASS_SECRET: undefined },
    { PATO_HOSTED_INTERNAL_PREVIEW: undefined },
    { PATO_LOCAL_INTERNAL: "" },
    { AR_REMOTE_DEMO: "" },
    { SANITY_DATASET: "production" },
    { SANITY_STUDIO_PREVIEW_URL: "https://foreign.example" },
    ...[
      "http://editorial.example",
      "https://localhost",
      "https://127.0.0.1",
      "https://ar-crafts-demo.vercel.app",
      "https://editorial.example:8443",
      "https://user:secret@editorial.example",
      "https://editorial.example/path",
      "https://editorial.example?secret=value",
      "https://editorial.example#",
      "https://editorial.example/../",
    ].map((origin) => ({
      AR_EDITORIAL_ALLOWED_ORIGIN: origin,
      SANITY_STUDIO_PREVIEW_URL: origin,
    })),
  ])("rejects unsafe hosted settings %j", (override) => {
    expect(() =>
      editorialConfiguration({ ...hosted(), ...override }),
    ).toThrow();
  });
});
describe("AR editorial isolation", () => {
  it("diagnoses presence without serializing secret values or asserting authentication", () => {
    const env = configured();
    const result = inspectEditorialEnvironment(env);
    expect(JSON.stringify(result)).not.toContain(env.SANITY_READ_TOKEN);
    expect(result.hostedAuthenticationVerified).toBe(false);
    expect(inspectEditorialEnvironment({}).missing).toContain(
      "SANITY_PROJECT_ID",
    );
  });
  it("accepts only matching isolated Studio/web settings", () => {
    expect(editorialConfiguration(configured()).dataset).toBe(
      "ar-crafts-editorial-test",
    );
    expect(() =>
      editorialConfiguration({
        ...configured(),
        SANITY_STUDIO_PROJECT_ID: "other-client",
      }),
    ).toThrow();
    expect(() =>
      editorialConfiguration({ ...configured(), SANITY_DATASET: "sandbox" }),
    ).toThrow();
    expect(() =>
      editorialConfiguration({
        ...configured(),
        SANITY_PROJECT_ID: "localdemo",
      }),
    ).toThrow();
  });
  it.each([
    { AR_REMOTE_DEMO: "enabled" },
    { AR_REMOTE_DEMO: "" },
    { AR_CONTENT_SOURCE: "fixture" },
    { PATO_SITE_VISIBILITY: "public" },
    { PATO_HOSTED_INTERNAL_PREVIEW: "authenticated" },
    { PATO_LOCAL_INTERNAL: undefined },
    { SANITY_WEBHOOK_ID: "" },
    { SANITY_STUDIO_PREVIEW_URL: "https://ar-crafts-demo.vercel.app" },
    { SANITY_STUDIO_PREVIEW_URL: "http://127.0.0.1:3000" },
    { PATO_STUDIO_ORIGIN: "http://127.0.0.1:3333" },
  ])("rejects conflicting or hosted configuration %j", (override) => {
    expect(() =>
      editorialConfiguration({ ...configured(), ...override }),
    ).toThrow();
  });
});
