import { expect, it } from "vitest";
import { editorialChildEnvironment } from "./runner-env";

it("filters operator and write secrets from web children, retaining server runtime configuration", () => {
  const env = {
    PATH: "runtime",
    AR_EDITORIAL_MODE: "hosted",
    AR_EDITORIAL_AUTOMATION_BYPASS_SECRET: "bypass",
    SANITY_WRITE_TOKEN: "write",
    SANITY_READ_TOKEN: "read",
    SANITY_PREVIEW_SECRET: "preview",
    SANITY_STUDIO_PROJECT_ID: "project",
  };
  expect(editorialChildEnvironment(env, false)).toEqual({
    PATH: "runtime",
    SANITY_READ_TOKEN: "read",
    SANITY_PREVIEW_SECRET: "preview",
    SANITY_STUDIO_PROJECT_ID: "project",
  });
  expect(env.SANITY_WRITE_TOKEN).toBe("write");
});
it("filters every server Sanity credential from Studio children", () => {
  expect(
    editorialChildEnvironment(
      {
        SANITY_READ_TOKEN: "read",
        SANITY_WRITE_TOKEN: "write",
        SANITY_REVALIDATION_TOKEN: "receipt",
        SANITY_WEBHOOK_SECRET: "webhook",
        SANITY_PREVIEW_SECRET: "preview",
        SANITY_STUDIO_PREVIEW_URL: "https://editorial.example",
        SANITY_STUDIO_PROJECT_ID: "project",
        SANITY_STUDIO_DATASET: "ar-crafts-editorial-test",
      },
      true,
    ),
  ).toEqual({
    SANITY_STUDIO_PREVIEW_URL: "https://editorial.example",
    SANITY_STUDIO_PROJECT_ID: "project",
    SANITY_STUDIO_DATASET: "ar-crafts-editorial-test",
  });
});

it("allows public deployment identity but strips unknown Studio variables and preview access", () => {
  expect(
    editorialChildEnvironment(
      {
        SANITY_STUDIO_HOST: "ar-crafts-editorial-test",
        SANITY_STUDIO_APP_ID: "app-id",
        SANITY_STUDIO_PRIVATE_TOKEN: "private",
        SANITY_AUTH_TOKEN: "cli-token",
        PATO_HOSTED_STUDIO_ORIGIN:
          "https://ar-crafts-editorial-test.sanity.studio",
        AR_EDITORIAL_PRESENTATION_BYPASS_SECRET: "bypass",
      },
      true,
    ),
  ).toEqual({
    SANITY_STUDIO_HOST: "ar-crafts-editorial-test",
    SANITY_STUDIO_APP_ID: "app-id",
  });
});
