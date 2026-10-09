import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("footer opens each complete legal draft and preserves closed notice during navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "Sobre las cookies" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar aviso" }).click();
  const links = [
    [
      "Términos y condiciones",
      "terminos-y-condiciones",
      "9. Ley aplicable y resolución de controversias",
    ],
    ["Política de privacidad", "privacidad", "9. Seguridad, cookies y cambios"],
    [
      "Política de cookies",
      "cookies",
      "5. Actualización y relación con privacidad",
    ],
    [
      "Entregas, cancelaciones y devoluciones",
      "condiciones-comerciales",
      "8. Versión aplicable",
    ],
  ];
  for (const [label, slug, lastSection] of links) {
    await page
      .getByRole("navigation", { name: "Información legal" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/legal/${slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText("Documento en borrador", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: lastSection, exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("complementary", { name: "Sobre las cookies" }),
    ).toHaveCount(0);
    await expect(page.locator(".legal-pending").first()).toBeVisible();
    expect(
      await page.locator('meta[name="robots"]').getAttribute("content"),
    ).toContain("noindex");
    await page
      .getByRole("link", { name: "Volver al inicio", exact: true })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.locator(".site-footer")).toHaveCount(1);
  }
  expect(
    await page.evaluate(() => ({
      cookies: document.cookie,
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ cookies: "", local: 0, session: 0 });
});

test("notice links to policy, dismisses by keyboard and appears again after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Ver política de cookies", exact: true })
    .click();
  await expect(page).toHaveURL(/\/legal\/cookies$/);
  const close = page.getByRole("button", { name: "Cerrar aviso" });
  await close.focus();
  await close.press("Enter");
  await expect(close).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Cerrar aviso" }),
  ).toBeVisible();
  const response = await page.goto("/legal/no-existe");
  expect(response?.status()).toBe(404);
});

for (const width of [320, 390, 768, 1440]) {
  test(`legal reading and footer fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/legal/privacidad");
    await page.getByRole("button", { name: "Cerrar aviso" }).click();
    if (width === 390 || width === 1440) {
      mkdirSync(".impeccable/review", { recursive: true });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `.impeccable/review/${width === 1440 ? "desktop" : "mobile"}.png`,
      });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const table = page.getByRole("region").first();
    await table.focus();
    await expect(table).toBeFocused();
    if (width < 1024) {
      await page.getByText("Contenido del documento", { exact: true }).click();
      await page
        .getByRole("navigation", { name: "Contenido del documento" })
        .getByRole("link", { name: "6. Conservación y eliminación" })
        .click();
      await expect(page).toHaveURL(/#seccion-/);
    }
    await page
      .getByRole("link", { name: "Volver al inicio", exact: true })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.locator(".site-footer")).toHaveCount(1);
    await page
      .getByRole("navigation", { name: "Información legal" })
      .scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440) {
      await page.reload();
      await page
        .getByRole("navigation", { name: "Información legal" })
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.impeccable/review/footer-${width}.png` });
    }
  });
}

test("legal text, tables and policy link remain readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/legal/cookies");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(1);
  await page
    .getByRole("navigation", { name: "Información legal" })
    .getByRole("link", { name: "Política de privacidad", exact: true })
    .click();
  await expect(page).toHaveURL(/\/legal\/privacidad$/);
  await context.close();
});
