import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`floral entries are finite and preserve scenes with ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-floral-motion-ready",
      "",
    );
    await expect(page.locator(".hero h1 > span")).toHaveAttribute(
      "data-floral-entered",
      "",
    );
    const title = page.locator("#workshops-title .motion-line").first();
    await title.scrollIntoViewIfNeeded();
    await expect(title).toHaveAttribute("data-floral-entered", "");
    await page.locator("#talleres .craft-art").first().scrollIntoViewIfNeeded();
    await expect(page.locator("#talleres .craft-art").first()).toHaveAttribute(
      "data-floral-entered",
      "",
    );
    await expect
      .poll(() => title.evaluate((node) => node.getAnimations().length))
      .toBe(0);
    await page.locator("#materiales").scrollIntoViewIfNeeded();
    await title.scrollIntoViewIfNeeded();
    // Revisiting a finished heading does not replay the entrance.
    expect(await title.evaluate((node) => node.getAnimations().length)).toBe(0);
    await expect(title).toBeVisible();
    await expect(
      page.locator(".inspiration-slide .craft-art[data-floral-entered]"),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`mobile menu interrupts and restores keyboard focus with ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-floral-motion-ready",
      "",
    );
    const summary = page.locator(".mobile-menu summary");
    const menu = page.locator(".mobile-menu");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary).toHaveAttribute("aria-expanded", "true");
    await expect
      .poll(() =>
        page
          .locator("#mobile-navigation")
          .evaluate((node) =>
            node
              .getAnimations()
              .some((animation) => animation.playState === "running"),
          ),
      )
      .toBe(true);
    // Reverse during exit instead of letting an old finish handler close it.
    await summary.evaluate((node: HTMLElement) => {
      node.click();
      node.click();
    });
    await expect(summary).toHaveAttribute("aria-expanded", "true");
    await page.waitForTimeout(250);
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(summary).toBeFocused();
    await expect(menu).not.toHaveAttribute("open", "");
    await summary.click();
    await page.locator('#mobile-navigation a[href="#materiales"]').click();
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(/#materiales$/);
    await expect(page.locator("#materials-title")).toBeInViewport();
  });
}

for (const failure of ["missing-observer", "animation-error"] as const) {
  test(`content and native navigation survive ${failure}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((failure) => {
      if (failure === "missing-observer") {
        Object.defineProperty(window, "IntersectionObserver", {
          value: undefined,
        });
        Object.defineProperty(Element.prototype, "animate", {
          value: undefined,
        });
      } else {
        Element.prototype.animate = () => {
          throw new Error("Simulated animation failure");
        };
      }
    }, failure);
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.locator(".mobile-menu summary").click();
    await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
    await page.locator('#mobile-navigation a[href="#talleres"]').click();
    await expect(page.locator("#workshops-title")).toBeInViewport();
    await expect(page.locator("#talleres .craft-art").first()).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("#workshops-title .motion-line")
          .first()
          .evaluate((node) => ({
            opacity: getComputedStyle(node).opacity,
            transform: getComputedStyle(node).transform,
          })),
      )
      .toEqual({ opacity: "1", transform: "none" });
  });
}
