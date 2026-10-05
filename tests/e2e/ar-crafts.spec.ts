import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
const captures = "docs/delivery/captures";
test("a failed material image keeps its fallback and contact accessible", async ({
  page,
}) => {
  await page.route("**/ar-crafts/conceptual/material-beads.svg", (route) =>
    route.abort(),
  );
  await page.goto("/#materiales");
  await expect(page.locator("#materiales .art-placeholder")).toContainText(
    "Imagen no disponible",
  );
  await expect(
    page
      .locator("#materiales")
      .getByRole("link", { name: /Ver contacto/ })
      .first(),
  ).toBeVisible();
});
test.beforeAll(() => mkdirSync(captures, { recursive: true }));
for (const width of [320, 390, 768, 1440]) {
  test(`layout and anchor journeys at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Contacto por confirmar" }),
    ).toBeDisabled();
    expect(await page.locator('a[href*="wa.me"]').count()).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page
          .locator(".butterfly-art")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
    await page.screenshot({ path: `${captures}/${width}-hero.png` });
    // Load all images, then capture the current top state; branches now reverse.
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let top = 0; top < height; top += 700) {
      await page.evaluate((top) => scrollTo(0, top), top);
      await page.waitForTimeout(80);
    }
    await expect
      .poll(() =>
        page
          .locator(".craft-art img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${captures}/${width}-full.png`,
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Explorar talleres", exact: false })
      .first()
      .click();
    await expect(page).toHaveURL(/#talleres$/);
    await page.goto("/#materiales");
    await expect(page.locator("#materiales h2")).toBeInViewport();
    if (width < 1024) {
      await page.locator(".mobile-menu summary").click();
      await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
      await page
        .locator("#mobile-navigation")
        .getByRole("link", { name: "Inspiración" })
        .click();
      await expect(page.locator(".mobile-menu")).not.toHaveAttribute(
        "open",
        "",
      );
    }
    await page.locator("#preguntas details summary").first().click();
    await expect(page.locator("#preguntas details").first()).toHaveAttribute(
      "open",
      "",
    );
  });
}
test("scroll reverses the scene and unwinds grown branches", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  await expect(page.locator(".inspiration-scene")).toHaveAttribute(
    "data-scene-ready",
    "",
  );
  const geometry = await page.locator(".inspiration-scene").evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    travel:
      (el as HTMLElement).offsetHeight -
      (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight,
  }));
  for (const [index, ratio] of [
    [0, 0.08],
    [1, 0.48],
    [2, 0.9],
  ]) {
    await page.evaluate(
      ({ top, travel, ratio }) =>
        scrollTo({ top: top + travel * ratio, behavior: "instant" }),
      { ...geometry, ratio },
    );
    await page.waitForTimeout(250);
    await expect(
      page.locator(".inspiration-slide[data-active=true]"),
    ).toHaveCount(1);
    await expect(page.locator(".scene-step[aria-current]")).toContainText(
      ["Pieza", "Detalle", "Manos"][index],
    );
    await expect(page.locator(".scene-story[data-active=true]")).toHaveCount(1);
    expect(
      await page
        .locator('.inspiration-slide[data-active="true"] .craft-art')
        .evaluate((el) => getComputedStyle(el).clipPath),
    ).toMatch(/^inset\(0(?:%|px)?(?:\s|\))/);
    await page.screenshot({ path: `${captures}/1440-scene-${index + 1}.png` });
  }
  const before = await page
    .locator('.branch-1440[data-branch="2"]')
    .getAttribute("data-grown");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
  expect(
    await page
      .locator('.branch-1440[data-branch="2"]')
      .getAttribute("data-grown"),
  ).not.toBe(before);
  await expect(page.locator('.branch-1440[data-branch="2"]')).toHaveAttribute(
    "data-grown",
    "0",
  );
  await expect(page.locator(".scene-step[aria-current]")).toContainText(
    "Pieza",
  );
});
test("keyboard navigation and effective 200% zoom layout", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 720, height: 450 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${captures}/zoom-200.png` });
  await context.close();
});
test("system policy with reduced motion leaves complete motifs and gallery images in flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator(".ar-site").evaluate((site) => {
    (site as HTMLElement).dataset.motionPolicy = "system";
    window.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator(".inspiration-scene")).not.toHaveAttribute(
    "data-scene-ready",
    "",
  );
  expect(
    await page.locator(".inspiration-slide[aria-hidden=true]").count(),
  ).toBe(0);
  await expect(page.locator(".inspiration-slide")).toHaveCount(3);
  await page.screenshot({
    path: `${captures}/reduced-motion.png`,
    fullPage: true,
  });
});
test("no JavaScript keeps native menu, FAQ, motifs and gallery usable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.locator(".mobile-menu summary").click();
  await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
  await page.locator("#preguntas details summary").first().click();
  await expect(page.locator("#preguntas details").first()).toHaveAttribute(
    "open",
    "",
  );
  expect(await page.locator("[data-grown]").count()).toBe(0);
  await page.screenshot({
    path: `${captures}/no-javascript.png`,
    fullPage: true,
  });
  await context.close();
});
test("initialization failure restores all gallery and decorative content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    SVGPathElement.prototype.getTotalLength = () => {
      throw new Error("synthetic failure");
    };
  });
  await page.goto("/");
  await expect(page.locator(".ar-site")).not.toHaveAttribute(
    "data-motion-ready",
    "",
  );
  await expect(page.locator(".inspiration-scene")).not.toHaveAttribute(
    "data-scene-ready",
    "",
  );
  expect(
    await page.locator(".inspiration-slide[aria-hidden=true]").count(),
  ).toBe(0);
});
test("late images and expanded FAQ preserve native scroll and branch geometry", async ({
  page,
}) => {
  await page.route("**/ar-crafts/**/*.svg", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto("/#preguntas");
  await page.locator("#preguntas summary").first().click();
  await page.waitForTimeout(500);
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Contacto", exact: true }).click();
  await expect(page).toHaveURL(/#contacto$/);
});
