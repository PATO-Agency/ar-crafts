import { expect, type Page } from "@playwright/test";

// Navigation can finish before React installs the controller, especially in
// WebKit with the development runtime. Readiness is a state, not a fixed sleep.
export async function waitForMotionController(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".inspiration-scene")).toHaveAttribute(
    "data-scene-reason",
    /.+/,
    { timeout: 15000 },
  );
}
