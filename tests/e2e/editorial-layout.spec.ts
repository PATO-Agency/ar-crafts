import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

for (const width of [320, 390, 852, 1440]) {
  test(`simulated editorial SSR layout at ${width}px (no hydration)`, async ({
    browser,
  }) => {
    // A fresh context prevents the hydrated fixture's observers from acting
    // on the injected SSR document. These tests verify only the no-JS layout.
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: width <= 390 ? 667 : 900 },
    });
    const page = await context.newPage();
    await page.goto("/");
    const css = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((link) => link.outerHTML).join(""));
    const markup = readFileSync(
      "tests/.generated/ar-editorial-published.html",
      "utf8",
    );
    await page.setContent(
      `<html lang="es"><head>${css}</head><body>${markup}</body></html>`,
    );
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-motion-policy",
      "always",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Prueba editorialAR Crafts.",
    );
    await expect(page.locator(".inspiration-images figure")).toHaveCount(3);
    await expect(
      page.locator(
        "[data-motion-ready], [data-scene-ready], [data-hero-ready]",
      ),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page
          .locator(".craft-art img")
          .evaluateAll((images) =>
            images.every(
              (image) => (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: "Contacto por confirmar" }),
    ).toBeDisabled();
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`editorial-${width}.png`),
      fullPage: true,
    });
    await context.close();
  });
}
