import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];
for (const [width, height, reducedMotion] of [
  [1440, 900, "no-preference"],
  [1440, 1000, "no-preference"],
  [1440, 660, "no-preference"],
  [1024, 900, "no-preference"],
  [1024, 660, "no-preference"],
  [768, 900, "no-preference"],
  [390, 900, "no-preference"],
  [320, 900, "no-preference"],
  [1440, 500, "no-preference"],
  [1440, 900, "reduce"],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(
        `HTTP ${response.status()} ${new URL(response.url()).pathname}`,
      );
  });
  const snapshot = async (label) => {
    await page.waitForTimeout(280);
    const state = await page.evaluate(() => {
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          docTop: r.top + scrollY,
        };
      };
      const scene = document.querySelector(".inspiration-scene");
      const sticky = scene.querySelector(".inspiration-sticky");
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const reason = reduced
        ? "reduced-motion"
        : innerWidth < 1024
          ? "width<1024"
          : innerHeight < 600
            ? "height<600"
            : scene.dataset.sceneEligible !== "true"
              ? "missing-stages"
              : sticky.scrollHeight > innerHeight * 0.92
                ? "content-too-tall"
                : "eligible";
      return {
        viewport: { width: innerWidth, height: innerHeight },
        reduced,
        scrollY,
        scene: {
          enhanced: scene.hasAttribute("data-scene-ready"),
          reason,
          diagnostic: scene.dataset.sceneReason ?? null,
          candidateHeight: scene.dataset.sceneHeight ?? null,
          rect: rect(scene),
          sticky: rect(sticky),
          scrollHeight: sticky.scrollHeight,
          position: getComputedStyle(sticky).position,
          steps: [...scene.querySelectorAll(".scene-step")].map((el) => ({
            text: el.textContent,
            current: el.getAttribute("aria-current"),
            ...rect(el),
          })),
          slides: [...scene.querySelectorAll(".inspiration-slide")].map(
            (el) => ({
              caption: el.textContent,
              visibility: getComputedStyle(el).visibility,
              opacity: getComputedStyle(el).opacity,
              ...rect(el),
            }),
          ),
        },
        branches: [...document.querySelectorAll("[data-branch]")]
          .filter((el) => el.getBoundingClientRect().width)
          .map((el) => {
            const stem = el.querySelector("[data-stem]");
            const length = stem.getTotalLength();
            const style = getComputedStyle(stem);
            const leaves = [...el.querySelectorAll("[data-leaf]")].map((leaf) =>
              Number(getComputedStyle(leaf).opacity),
            );
            return {
              index: el.dataset.branch,
              layout: el.dataset.layout,
              ...rect(el),
              length,
              progress: el.getAttribute("data-grown"),
              dasharray: style.strokeDasharray,
              dashoffset: style.strokeDashoffset,
              leaves: {
                total: leaves.length,
                hidden: leaves.filter((v) => v === 0).length,
                full: leaves.filter((v) => v === 1).length,
                between: leaves.filter((v) => v > 0 && v < 1).length,
              },
            };
          }),
      };
    });
    report.push({ label, ...state, errors: [...errors] });
  };
  await page.goto("http://127.0.0.1:3000/");
  await page.evaluate(() => document.fonts.ready);
  await snapshot("fresh");
  const branch = await page
    .locator('[data-branch="1"]')
    .evaluateAll((elements) => {
      const element = elements.find((el) => el.getBoundingClientRect().width);
      const r = element.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
  for (const ratio of [0.25, 0.6, 1.03]) {
    await page.evaluate(
      ({ top, height, ratio }) =>
        scrollTo({
          top: top - innerHeight * 0.85 + ratio * (height + innerHeight * 0.5),
          behavior: "instant",
        }),
      { ...branch, ratio },
    );
    await snapshot(`branch-1-${ratio}`);
  }
  for (const ratio of [0.05, 0.48, 0.9, 0.48, 0.05]) {
    await page.evaluate((ratio) => {
      const scene = document.querySelector(".inspiration-scene");
      const sticky = scene.querySelector(".inspiration-sticky");
      scrollTo({
        top:
          scene.getBoundingClientRect().top +
          scrollY +
          (scene.offsetHeight - sticky.offsetHeight) * ratio,
        behavior: "instant",
      });
    }, ratio);
    await snapshot(`scene-${ratio}`);
  }
  await page.evaluate(() =>
    scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await snapshot("bottom");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await snapshot("revisited-top");
  await page.close();
}
await browser.close();
const path = process.argv[2] ?? "docs/delivery/motion-current.json";
writeFileSync(path, JSON.stringify(report, null, 2));
for (const state of report.filter((row) =>
  ["fresh", "scene-0.48", "revisited-top"].includes(row.label),
)) {
  console.log(
    JSON.stringify({
      label: state.label,
      viewport: state.viewport,
      reduced: state.reduced,
      scene: {
        enhanced: state.scene.enhanced,
        reason: state.scene.diagnostic,
        stickyHeight: state.scene.scrollHeight,
        stickyTop: state.scene.sticky.top,
        visible: state.scene.slides
          .filter(
            (slide) =>
              slide.visibility === "visible" && Number(slide.opacity) > 0.95,
          )
          .map((slide) => slide.caption),
      },
      branches: state.branches.slice(0, 2),
      errors: state.errors,
    }),
  );
}
