import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
for (const count of [0, 6, 12]) {
  test(`native material disclosure and long content with ${count} items`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/");
    const css = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((link) => link.outerHTML).join(""));
    const markup = readFileSync(
      `tests/.generated/materials-${count}.html`,
      "utf8",
    );
    await page.setContent(
      `<html lang="es"><head>${css}</head><body><main class="ar-site">${markup}</main></body></html>`,
    );
    await expect(page.getByRole("article")).toHaveCount(Math.min(6, count));
    if (count > 6) {
      const disclosure = page.getByText(`Ver todos los materiales (${count})`);
      await disclosure.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("article")).toHaveCount(count);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("article")).toHaveCount(6);
    } else await expect(page.locator(".materials-disclosure")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (count > 0)
      await expect(
        page.getByRole("link", { name: /Ver contacto/ }).first(),
      ).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath(`materials-${count}-320.png`),
      fullPage: true,
    });
  });
}
