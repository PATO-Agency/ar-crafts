import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { waitForMotionController } from "./motion-ready";

for (const [width, height] of [
  [320, 568],
  [390, 667],
  [390, 844],
]) {
  test(`compact mobile hero exposes both routes without scrolling at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const actions = page.locator(".hero-actions a");
    await expect(actions).toHaveCount(2);
    for (const action of await actions.all()) {
      await expect(action).toBeInViewport({ ratio: 1 });
      const bounds = await action.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(52);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const section of ["talleres", "materiales"]) {
      await settledScroll(page, 0);
      await page.locator(`.hero-actions a[href="#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      await expect(page.locator(`#${section} h2`)).toBeInViewport();
    }
  });
}

type BranchProbeWindow = typeof window & {
  branchProbe: {
    take(): {
      mutations: number;
      writes: number;
      reads: Record<string, number>;
      lengths: number;
    };
    stop(): void;
  };
};

async function observeBranchWork(page: Page) {
  await page.evaluate(() => {
    const branch = document.querySelector('.branch-1440[data-branch="6"]')!;
    const styles = new Set(
      [...branch.querySelectorAll<SVGElement>("*")].map((el) => el.style),
    );
    let mutations = 0,
      writes = 0,
      lengths = 0;
    let reads: Record<string, number> = {};
    const originalRect = Element.prototype.getBoundingClientRect;
    const originalSet = CSSStyleDeclaration.prototype.setProperty;
    const originalLength = SVGGeometryElement.prototype.getTotalLength;
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches("svg[data-branch]")) {
        const layout = this.getAttribute("data-layout")!;
        reads[layout] = (reads[layout] ?? 0) + 1;
      }
      return originalRect.call(this);
    };
    CSSStyleDeclaration.prototype.setProperty = function (...args) {
      if (styles.has(this)) writes++;
      return originalSet.apply(this, args);
    };
    SVGGeometryElement.prototype.getTotalLength = function () {
      lengths++;
      return originalLength.call(this);
    };
    const observer = new MutationObserver((records) => {
      mutations += records.length;
    });
    observer.observe(branch, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-grown"],
    });
    (window as BranchProbeWindow).branchProbe = {
      take() {
        mutations += observer.takeRecords().length;
        const result = { mutations, writes, reads, lengths };
        mutations = writes = lengths = 0;
        reads = {};
        return result;
      },
      stop() {
        observer.disconnect();
        Element.prototype.getBoundingClientRect = originalRect;
        CSSStyleDeclaration.prototype.setProperty = originalSet;
        SVGGeometryElement.prototype.getTotalLength = originalLength;
      },
    };
  });
}

async function settledScroll(page: Page, top: number) {
  await page.evaluate(async (top) => {
    scrollTo({ top, behavior: "instant" });
    // Also exercise a scheduled update when a clamped position stays identical.
    dispatchEvent(new Event("scroll"));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }, top);
}

test("a distant active branch stops identical writes at both clamps and restores on reverse", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.locator('footer a[href="#galeria"]').click();
  await page
    .locator(".inspiration-slide img")
    .evaluateAll((imgs) =>
      Promise.all(
        imgs.map((img) =>
          (img as HTMLImageElement).decode().catch(() => undefined),
        ),
      ),
    );
  await settledScroll(page, 0);
  // Isolate scroll writes from legitimate invalidations by late lazy assets.
  await page.waitForLoadState("networkidle");
  const branch = page.locator('.branch-1440[data-branch="6"]');
  await expect(branch).toHaveAttribute("data-grown", "0");
  const geometry = await branch.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    height: el.getBoundingClientRect().height,
  }));
  await observeBranchWork(page);
  const take = () =>
    page.evaluate(() => (window as BranchProbeWindow).branchProbe.take());
  const evidence = [];
  try {
    for (const top of [20, 40, 60]) {
      await settledScroll(page, top);
      expect(await page.evaluate(() => scrollY)).toBe(top);
      await expect(branch).toHaveAttribute("data-grown", "0");
    }
    const zero = await take();
    expect(zero.mutations).toBe(0);
    expect(zero.writes).toBe(0);
    evidence.push({ phase: "zero", ...zero });
    const middle =
      geometry.top - 900 * 0.95 + 0.45 * (geometry.height + 900 * 0.83);
    await settledScroll(page, middle);
    const actualMiddle = await page.evaluate(() => scrollY);
    await expect
      .poll(() => branch.getAttribute("data-grown").then(Number))
      .toBeCloseTo(0.45, 2);
    const snapshot = await branch.evaluate((el) => ({
      grown: el.getAttribute("data-grown"),
      styles: [
        ...el.querySelectorAll<SVGElement>("[data-stem], [data-leaf]"),
      ].map((part) => part.getAttribute("style")),
    }));
    const entering = await take();
    expect(entering.mutations).toBeGreaterThan(0);
    expect(entering.writes).toBeGreaterThan(0);
    evidence.push({ phase: "middle", ...entering });
    await page.screenshot({
      path: testInfo.outputPath("003-branch-middle.png"),
    });
    const end = await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight,
    );
    await settledScroll(page, end);
    await expect(branch).toHaveAttribute("data-grown", "1");
    await take();
    for (const top of [end - 20, end - 40, end - 20]) {
      await settledScroll(page, top);
      expect(await page.evaluate(() => scrollY)).toBe(top);
      await expect(branch).toHaveAttribute("data-grown", "1");
    }
    const full = await take();
    expect(full.mutations).toBe(0);
    expect(full.writes).toBe(0);
    evidence.push({ phase: "one", ...full });
    await settledScroll(page, actualMiddle);
    await expect
      .poll(() =>
        branch.evaluate((el) => ({
          grown: el.getAttribute("data-grown"),
          styles: [
            ...el.querySelectorAll<SVGElement>("[data-stem], [data-leaf]"),
          ].map((part) => part.getAttribute("style")),
        })),
      )
      .toEqual(snapshot);
    await page.screenshot({
      path: testInfo.outputPath("003-branch-reverse.png"),
    });
    await settledScroll(page, 0);
    await expect(branch).toHaveAttribute("data-grown", "0");
    expect(
      await branch
        .locator("[data-leaf]")
        .evaluateAll((leaves) =>
          leaves.every((leaf) => getComputedStyle(leaf).opacity === "0"),
        ),
    ).toBe(true);
    await testInfo.attach("branch-clamps", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json",
    });
  } finally {
    await page.evaluate(() => (window as BranchProbeWindow).branchProbe.stop());
  }
});

test("breakpoint crossings measure only the current family and reset reapplies cached dasharrays", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  await observeBranchWork(page);
  const evidence = [];
  try {
    for (const width of [
      359, 360, 767, 768, 1023, 1024, 1023, 768, 767, 360, 359,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const layout =
        width < 360
          ? "320"
          : width < 768
            ? "390"
            : width < 1024
              ? "768"
              : "1440";
      const branch = page.locator(`.branch-${layout}[data-branch="1"]`);
      await expect(branch.locator("[data-stem]")).not.toHaveCSS(
        "stroke-dasharray",
        "none",
      );
      const geometry = await branch.evaluate((el) => ({
        top: el.getBoundingClientRect().top + scrollY,
        height: el.getBoundingClientRect().height,
      }));
      await settledScroll(
        page,
        geometry.top - 900 * 0.95 + 0.6 * (geometry.height + 900 * 0.83),
      );
      await expect
        .poll(() => branch.getAttribute("data-grown").then(Number))
        .toBeCloseTo(0.6, 2);
      const paint = await branch.evaluate((el) => {
        const rect = el.getBoundingClientRect(),
          stem = el.querySelector<SVGPathElement>("[data-stem]")!;
        const length = stem.getTotalLength(),
          progress = Math.max(
            0,
            Math.min(
              1,
              (innerHeight * 0.95 - rect.top) /
                (rect.height + innerHeight * 0.83),
            ),
          );
        return {
          progress,
          length,
          array: Number(stem.style.strokeDasharray),
          offset: Number(stem.style.strokeDashoffset),
          leaves: [...el.querySelectorAll<SVGElement>("[data-leaf]")].map(
            (leaf) => {
              let closest = Infinity,
                attachment = 0;
              for (let i = 0; i <= 640; i++) {
                const point = stem.getPointAtLength((length * i) / 640);
                const distance = Math.hypot(
                  point.x - Number(leaf.dataset.attachX),
                  point.y - Number(leaf.dataset.attachY),
                );
                if (distance < closest) {
                  closest = distance;
                  attachment = i / 640;
                }
              }
              return {
                attachment,
                opacity: Number(getComputedStyle(leaf).opacity),
              };
            },
          ),
        };
      });
      expect(paint.array).toBeCloseTo(paint.length, 2);
      expect(paint.offset).toBeCloseTo(paint.length * (1 - paint.progress), 2);
      for (const leaf of paint.leaves) {
        if (leaf.attachment < paint.progress - 0.08)
          expect(leaf.opacity).toBe(1);
        if (leaf.attachment > paint.progress + 0.015)
          expect(leaf.opacity).toBe(0);
      }
      const visible = await page
        .locator('svg[data-branch="1"]')
        .evaluateAll((els) =>
          els
            .filter((el) => getComputedStyle(el).display !== "none")
            .map((el) => el.getAttribute("data-layout")),
        );
      expect(visible).toEqual([layout]);
      await page.evaluate(() =>
        (window as BranchProbeWindow).branchProbe.take(),
      );
      const top = await page.evaluate(() => scrollY);
      await settledScroll(page, top + 1);
      await settledScroll(page, top);
      const calls = await page.evaluate(() =>
        (window as BranchProbeWindow).branchProbe.take(),
      );
      expect(Object.keys(calls.reads)).toEqual([layout]);
      expect(calls.reads[layout]).toBeGreaterThanOrEqual(14);
      expect(calls.lengths).toBe(0);
      evidence.push({ width, layout, ...calls });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".ar-site").evaluate((el) => {
      (el as HTMLElement).dataset.motionPolicy = "system";
      dispatchEvent(new Event("resize"));
    });
    await expect(page.locator(".ar-site")).not.toHaveAttribute(
      "data-motion-ready",
      "",
    );
    await expect(
      page.locator('.branch-320[data-branch="1"] [data-stem]'),
    ).not.toHaveAttribute("style", /stroke-dasharray/);
    await page.evaluate(() => (window as BranchProbeWindow).branchProbe.take());
    const top = await page.evaluate(() => scrollY);
    await settledScroll(page, top + 1);
    await settledScroll(page, top);
    const fallback = await page.evaluate(() =>
      (window as BranchProbeWindow).branchProbe.take(),
    );
    expect(fallback.mutations).toBe(0);
    expect(fallback.writes).toBe(0);
    await page.locator(".ar-site").evaluate((el) => {
      (el as HTMLElement).dataset.motionPolicy = "always";
      dispatchEvent(new Event("resize"));
    });
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-motion-ready",
      "",
    );
    await expect(
      page.locator('.branch-320[data-branch="1"] [data-stem]'),
    ).not.toHaveCSS("stroke-dasharray", "none");
    const reactivated = await page.evaluate(() =>
      (window as BranchProbeWindow).branchProbe.take(),
    );
    expect(reactivated.lengths).toBe(0);
    await testInfo.attach("active-family-reads", {
      body: JSON.stringify({ evidence, fallback, reactivated }, null, 2),
      contentType: "application/json",
    });
  } finally {
    await page.evaluate(() => (window as BranchProbeWindow).branchProbe.stop());
  }
});

async function sceneGeometry(page: Page) {
  return page.locator(".inspiration-scene").evaluate((scene) => {
    const sticky = scene.querySelector<HTMLElement>(".inspiration-sticky")!;
    const r = scene.getBoundingClientRect();
    return {
      top: r.top + scrollY,
      travel: (scene as HTMLElement).offsetHeight - sticky.offsetHeight,
    };
  });
}
async function scenePaint(page: Page) {
  return page.locator(".inspiration-scene").evaluate((scene) => {
    const sticky = scene.querySelector<HTMLElement>(".inspiration-sticky")!;
    const heading = scene.querySelector("h2")!.getBoundingClientRect();
    const steps = scene.querySelector(".scene-steps")!.getBoundingClientRect();
    return {
      position: getComputedStyle(sticky).position,
      top: sticky.getBoundingClientRect().top,
      bottom: sticky.getBoundingClientRect().bottom,
      headingTop: heading.top,
      stepsTop: steps.top,
      visible: [...scene.querySelectorAll<HTMLElement>(".inspiration-slide")]
        .filter((el) => {
          const style = getComputedStyle(el);
          if (style.visibility !== "visible" || Number(style.opacity) <= 0.95)
            return false;
          if (!scene.hasAttribute("data-scene-ready")) return true;
          const image = el.querySelector(".craft-art")!;
          const imageStyle = getComputedStyle(image);
          const clip = imageStyle.clipPath;
          const inset = clip.match(
            /^inset\(([-\d.]+)(%|px)(?:\s+[-\d.]+(?:%|px)?){0,3}\)$/,
          );
          if (clip !== "none" && !inset)
            throw new Error(`Unexpected clip: ${clip}`);
          const reveal =
            clip === "none"
              ? 1
              : 1 -
                Number(inset![1]) /
                  (inset![2] === "%"
                    ? 100
                    : image.getBoundingClientRect().height);
          return (
            el.dataset.active === "true" &&
            reveal >= 0.99 &&
            (imageStyle.clipPath === "none" ||
              !/[1-9]/.test(imageStyle.clipPath))
          );
        })
        .map((el) => el.querySelector("figcaption")!.textContent),
      current: scene.querySelector(".scene-step[aria-current]")?.textContent,
    };
  });
}

test("a failed gallery image keeps its masked placeholder and survives flow transitions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/ar-crafts/conceptual/gallery-gem-flower.svg", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator(".inspiration-scene");
  const detail = scene.locator(".inspiration-slide").nth(1);
  const seek = async () => {
    await expect(scene).toHaveAttribute("data-scene-reason", "active");
    const geometry = await sceneGeometry(page);
    await page.evaluate(
      ({ top, travel }) =>
        scrollTo({ top: top + travel * 0.28, behavior: "instant" }),
      geometry,
    );
    await expect(detail).toHaveAttribute("data-active", "true");
    await expect(detail.locator(".art-placeholder")).toBeVisible();
    await expect
      .poll(() =>
        detail
          .locator(".craft-art")
          .evaluate((el) =>
            Number(
              getComputedStyle(el).clipPath.match(/^inset\(([-\d.]+)%/)?.[1],
            ),
          ),
      )
      .toBeCloseTo(300 / 7, 0);
  };
  await seek();
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  await page.screenshot({
    path: testInfo.outputPath("failed-image-masked.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(scene).toHaveAttribute("data-scene-reason", "viewport-width");
  await expect(detail.locator(".craft-art")).toHaveCSS("clip-path", "none");
  await expect(scene.locator(".inspiration-slide[aria-hidden]")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await seek();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".ar-site").evaluate((el) => {
    (el as HTMLElement).dataset.motionPolicy = "system";
    window.dispatchEvent(new Event("resize"));
  });
  await expect(scene).toHaveAttribute("data-scene-reason", "reduced-motion");
  await expect(detail.locator(".craft-art")).toHaveCSS("clip-path", "none");
  await page.locator(".ar-site").evaluate((el) => {
    (el as HTMLElement).dataset.motionPolicy = "always";
    window.dispatchEvent(new Event("resize"));
  });
  await seek();
});

test("a replaced image receives the same zoom and reset preserves unrelated inline styles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator(".inspiration-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "");
  const geometry = await sceneGeometry(page);
  await page.evaluate(
    ({ top, travel }) =>
      scrollTo({ top: top + travel * 0.68, behavior: "instant" }),
    geometry,
  );
  const image = scene.locator(".inspiration-slide img").nth(2);
  await expect
    .poll(() =>
      image.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
    )
    .toBeGreaterThan(1);
  const before = await image.evaluate((el) => getComputedStyle(el).transform);
  const detachedTransform = await image.evaluate(async (el) => {
    const clone = el.cloneNode(true) as HTMLImageElement;
    clone.style.removeProperty("transform");
    clone.style.color = "rgb(1, 2, 3)";
    el.replaceWith(clone);
    clone.dispatchEvent(new Event("load"));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return (el as HTMLElement).style.transform;
  });
  expect(detachedTransform).toBe("");
  await expect(image).toHaveCSS("transform", before);
  await page
    .locator(
      ".butterfly-svg, .hero-copy, [data-butterfly-orbit], .scene-progress > span, .inspiration-slide .craft-art",
    )
    .evaluateAll((els) =>
      els.forEach((el) =>
        (el as HTMLElement | SVGElement).style.setProperty(
          "color",
          "rgb(1, 2, 3)",
        ),
      ),
    );
  const executors = page.locator(
    ".butterfly-svg, .hero-copy, [data-butterfly-orbit], .scene-progress > span, .inspiration-slide .craft-art, .inspiration-slide img",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(scene).not.toHaveAttribute("data-scene-ready", "");
  const cleaned = await executors.evaluateAll((els) =>
    els.map((el) => ({
      transform: (el as HTMLElement).style.transform,
      clip: (el as HTMLElement).style.clipPath,
      opacity: (el as HTMLElement).style.opacity,
      color: (el as HTMLElement).style.color,
    })),
  );
  expect(
    cleaned.every(
      (el) => el.transform === "" && el.clip === "" && el.opacity === "",
    ),
  ).toBe(true);
  expect(cleaned.filter((el) => el.color === "rgb(1, 2, 3)")).toHaveLength(8);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(scene).toHaveAttribute("data-scene-ready", "");
  await expect(image).not.toHaveAttribute("style", /transform:\s*$/);
  await expect
    .poll(() => image.evaluate((el) => el.style.transform.startsWith("scale(")))
    .toBe(true);
});

test("a fresh 1440×660 scene fits and renders the same sticky as after resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 660 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("sticky");
  const geometry = await sceneGeometry(page);
  await page.evaluate(
    ({ top, travel }) =>
      scrollTo({ top: top + travel * 0.48, behavior: "instant" }),
    geometry,
  );
  await expect
    .poll(async () => (await scenePaint(page)).visible)
    .toEqual(["Detalles que brillan · ilustración"]);
  const fresh = await scenePaint(page);
  expect(fresh.top).toBeCloseTo(660 * 0.04, 0);
  expect(fresh.bottom).toBeLessThan(660);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1440, height: 660 });
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("sticky");
  expect((await scenePaint(page)).bottom).toBeLessThan(660);
});

test("the rendered scene holds title and steps and reverses its visible image", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await waitForMotionController(page);
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("sticky");
  const geometry = await sceneGeometry(page);
  const readings = [];
  for (const [ratio, stage, caption] of [
    [0.08, "Pieza", "Formas orgánicas · pieza conceptual"],
    [0.48, "Detalle", "Detalles que brillan · ilustración"],
    [0.9, "Manos", "Manos que crean · esquema de encuadre"],
    [0.48, "Detalle", "Detalles que brillan · ilustración"],
    [0.08, "Pieza", "Formas orgánicas · pieza conceptual"],
  ] as const) {
    await page.evaluate(
      ({ top, travel, ratio }) =>
        scrollTo({ top: top + travel * ratio, behavior: "instant" }),
      { ...geometry, ratio },
    );
    await expect
      .poll(async () => (await scenePaint(page)).visible)
      .toEqual([caption]);
    const paint = await scenePaint(page);
    expect(paint.current).toContain(stage);
    expect(paint.top).toBeCloseTo(36, 0);
    expect(paint.bottom).toBeLessThan(900);
    readings.push(paint);
  }
  expect(
    Math.max(...readings.map((r) => r.headingTop)) -
      Math.min(...readings.map((r) => r.headingTop)),
  ).toBeLessThan(1);
  expect(
    Math.max(...readings.map((r) => r.stepsTop)) -
      Math.min(...readings.map((r) => r.stepsTop)),
  ).toBeLessThan(1);
});

test("stems draw their curves and leaves unfold and retract with the painted length", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const branch = page.locator('.branch-1440[data-branch="1"]');
  const read = () =>
    branch.evaluate((el) => {
      const stem = el.querySelector<SVGPathElement>("[data-stem]")!;
      const length = stem.getTotalLength();
      const offset = parseFloat(getComputedStyle(stem).strokeDashoffset);
      const painted = length - offset;
      return {
        length,
        offset,
        painted,
        leaves: [...el.querySelectorAll<SVGElement>("[data-leaf]")].map(
          (leaf) => {
            const x = Number(leaf.dataset.attachX),
              y = Number(leaf.dataset.attachY);
            let distance = Infinity,
              attachment = 0;
            // Independent finer sampling compares the rendered stroke endpoint to each leaf.
            for (let i = 0; i <= 640; i++) {
              const point = stem.getPointAtLength((length * i) / 640);
              const d = Math.hypot(point.x - x, point.y - y);
              if (d < distance) {
                distance = d;
                attachment = (length * i) / 640;
              }
            }
            return {
              opacity: Number(getComputedStyle(leaf).opacity),
              attachment,
            };
          },
        ),
      };
    });
  await expect.poll(async () => (await read()).offset).toBeGreaterThan(1600);
  const before = await read();
  expect(before.leaves.every((l) => l.opacity === 0)).toBe(true);
  const bounds = await branch.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  });
  const counts = [];
  for (const ratio of [0.25, 0.6, 1.03, 0.6, 0.25, 0]) {
    await page.evaluate(
      ({ top, height, ratio }) =>
        scrollTo({
          top: top - innerHeight * 0.95 + ratio * (height + innerHeight * 0.83),
          behavior: "instant",
        }),
      { ...bounds, ratio },
    );
    await expect
      .poll(async () => (await read()).painted)
      .toBeCloseTo(before.length * Math.min(1, ratio), -1);
    await page.waitForTimeout(240);
    const state = await read();
    expect(state.painted / state.length).toBeCloseTo(Math.min(1, ratio), 2);
    for (const leaf of state.leaves) {
      if (leaf.attachment < state.painted - state.length * 0.075)
        expect(leaf.opacity).toBe(1);
      if (leaf.attachment > state.painted + state.length * 0.015)
        expect(leaf.opacity).toBe(0);
    }
    counts.push(state.leaves.filter((l) => l.opacity === 1).length);
  }
  expect(counts[1]).toBeGreaterThan(counts[0]);
  expect(counts[2]).toBe(before.leaves.length);
  expect(counts[3]).toBe(counts[1]);
  expect(counts[4]).toBe(counts[0]);
  expect(counts[5]).toBe(0);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(250);
  expect((await read()).offset).toBeCloseTo(before.length, 0);
});

test("a media API initialization failure preserves the page and complete rendered motifs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      if (query === "(prefers-reduced-motion: reduce)")
        throw new Error("synthetic media failure");
      return original(query);
    };
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("static");
  const state = await page
    .locator(".branch-1440")
    .first()
    .evaluate((el) => ({
      offset: getComputedStyle(el.querySelector("[data-stem]")!)
        .strokeDashoffset,
      leaves: [...el.querySelectorAll("[data-leaf]")].map(
        (leaf) => getComputedStyle(leaf).opacity,
      ),
    }));
  expect(parseFloat(state.offset)).toBe(0);
  expect(state.leaves.every((opacity) => opacity === "1")).toBe(true);
  expect((await scenePaint(page)).visible).toHaveLength(3);
});

test("menu, FAQ, material disclosure and late image changes move downstream branches by the content delta", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  const position = (index: number) =>
    page.locator(`.branch-390[data-branch="${index}"]`).evaluate((el) => {
      const stem = el.querySelector<SVGPathElement>("[data-stem]")!;
      return {
        top: el.getBoundingClientRect().top + scrollY,
        offset: parseFloat(getComputedStyle(stem).strokeDashoffset),
      };
    });
  const beforeMenu = await position(1);
  await page.locator(".mobile-menu summary").click();
  await expect
    .poll(async () => (await position(1)).top)
    .toBeGreaterThan(beforeMenu.top + 300);
  const menuOpen = await position(1);
  await page.locator(".mobile-menu summary").click();
  await expect
    .poll(async () => (await position(1)).top)
    .toBeCloseTo(beforeMenu.top, 0);

  const beforeFaq = await position(6);
  await page
    .locator("#preguntas details")
    .first()
    .evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
  await expect
    .poll(async () => (await position(6)).top)
    .toBeGreaterThan(beforeFaq.top + 100);
  const faqOpen = await position(6);
  await page
    .locator("#preguntas details")
    .first()
    .evaluate((el: HTMLDetailsElement) => {
      el.open = false;
    });
  await expect
    .poll(async () => (await position(6)).top)
    .toBeCloseTo(beforeFaq.top, 0);

  // Twelve materials are SSR output of the real component, not a product QA route.
  const markup = readFileSync("tests/.generated/materials-12.html", "utf8");
  await page.locator("#materiales").evaluate((el, markup) => {
    el.innerHTML = new DOMParser()
      .parseFromString(markup, "text/html")
      .querySelector("#materiales")!.innerHTML;
  }, markup);
  const beforeMaterials = await position(3);
  const sectionHeight = () =>
    page
      .locator("#materiales")
      .evaluate((el) => el.getBoundingClientRect().height);
  const closedHeight = await sectionHeight();
  await page
    .locator(".materials-disclosure")
    .evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
  await expect
    .poll(async () => (await position(3)).top)
    .toBeGreaterThan(beforeMaterials.top + 1000);
  const materialsOpen = await position(3);
  expect(materialsOpen.top - beforeMaterials.top).toBeCloseTo(
    (await sectionHeight()) - closedHeight,
    0,
  );
  await page
    .locator(".materials-disclosure")
    .evaluate((el: HTMLDetailsElement) => {
      el.open = false;
    });
  await expect
    .poll(async () => (await position(3)).top)
    .toBeCloseTo(beforeMaterials.top, 0);

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/about-botanical.svg?geometry-probe", async (route) => {
    await held;
    await route.continue();
  });
  const beforeImage = await position(4);
  await page.locator(".essence-copy").evaluate((el) => {
    const image = document.createElement("img");
    image.alt = "Geometry probe";
    image.style.cssText =
      "width:220px;max-width:100%;height:auto;display:block";
    image.src = "/ar-crafts/conceptual/about-botanical.svg?geometry-probe";
    el.append(image);
  });
  await page.waitForTimeout(100);
  const unloadedImage = await position(4);
  release();
  await expect
    .poll(async () => (await position(4)).top)
    .toBeGreaterThan(unloadedImage.top + 100);
  const loadedImage = await position(4);
  const imageHeight = await page
    .getByAltText("Geometry probe")
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(loadedImage.top - unloadedImage.top).toBeCloseTo(imageHeight, 0);
  // Changing upstream heights without scrolling must redraw a newly reached stem.
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  const beforeShift = await position(1);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>(
      ".hero-scene, .journeys",
    )) {
      el.style.height = "0";
      el.style.overflow = "hidden";
      el.style.padding = "0";
    }
  });
  await expect
    .poll(async () => (await position(1)).offset)
    .toBeLessThan(beforeShift.offset - 100);
  console.log(
    "geometry-rendered " +
      JSON.stringify({
        beforeMenu,
        menuOpen,
        beforeFaq,
        faqOpen,
        beforeMaterials,
        materialsOpen,
        beforeImage,
        unloadedImage,
        loadedImage,
        imageHeight,
      }),
  );
});

test("finite jewel glints change original facet/setting paint and return to rest", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  const readings = await page
    .locator(".butterfly-svg")
    .evaluate(async (svg) => {
      const paths = [...svg.querySelectorAll<SVGPathElement>("[data-glint]")];
      return await Promise.all(
        paths.map(async (path) => {
          const animation = path.getAnimations()[0];
          await animation.ready;
          animation.pause();
          const timing = animation.effect!.getTiming();
          const duration = Number(timing.duration);
          const delay = Number(timing.delay ?? 0);
          const paint = () => ({
            opacity: Number(getComputedStyle(path).opacity),
            scale: new DOMMatrix(getComputedStyle(path).transform).a,
          });
          animation.currentTime = 0;
          const before = paint();
          animation.currentTime = delay + duration * 0.4;
          const during = paint();
          animation.currentTime = delay + duration + 1;
          const after = paint();
          return {
            kind: path.getAttribute("data-glint"),
            iterations: timing.iterations,
            before,
            during,
            after,
          };
        }),
      );
    });
  expect(readings).toHaveLength(6);
  for (const reading of readings) {
    expect(reading.iterations).toBe(1);
    if (reading.kind === "facet")
      expect(reading.during.opacity).toBeGreaterThan(reading.before.opacity);
    else expect(reading.during.scale).toBeGreaterThan(reading.before.scale);
    expect(reading.after).toEqual(reading.before);
  }
});

for (const [width, height, reducedMotion, reason] of [
  [768, 900, "no-preference", "viewport-width"],
  [390, 900, "no-preference", "viewport-width"],
  [320, 900, "no-preference", "viewport-width"],
  [1440, 500, "no-preference", "viewport-height"],
  [1440, 900, "reduce", "reduced-motion"],
] as const) {
  test(`normal flow and rendered fallback at ${width}×${height}, ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width, height });
    await page.goto("/");
    // Exercise the optional system fallback separately from the default policy.
    await page.locator(".ar-site").evaluate((site) => {
      (site as HTMLElement).dataset.motionPolicy = "system";
      window.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator(".inspiration-scene")).toHaveAttribute(
      "data-scene-reason",
      reason,
    );
    expect((await scenePaint(page)).position).toBe("static");
    expect((await scenePaint(page)).visible).toHaveLength(3);
    if (reducedMotion === "reduce") {
      const fallback = await page.locator(".butterfly-svg").evaluate((svg) => ({
        animations: svg.getAnimations({ subtree: true }).length,
        opacity: getComputedStyle(svg.querySelector('[data-glint="facet"]')!)
          .opacity,
        offset: getComputedStyle(
          document.querySelector(".branch-1440 [data-stem]")!,
        ).strokeDashoffset,
        leaves: [...document.querySelectorAll(".branch-1440 [data-leaf]")].map(
          (el) => getComputedStyle(el).opacity,
        ),
      }));
      expect(fallback.animations).toBe(0);
      expect(fallback.opacity).toBe("0.25");
      expect(parseFloat(fallback.offset)).toBe(0);
      expect(fallback.leaves.every((opacity) => opacity === "1")).toBe(true);
    }
  });
}

test("the landing animates under reduced motion, including the narrow desktop preview", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 852, height: 1004 });
  await page.goto("/");
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-policy",
    "always",
  );
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  await expect(page.locator(".inspiration-scene")).toHaveAttribute(
    "data-scene-reason",
    "active",
  );
  const paint = await page.evaluate(() => {
    const branch = document.querySelector('.branch-768[data-branch="1"]')!;
    return {
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      arrival: getComputedStyle(document.querySelector(".butterfly-art")!)
        .animationName,
      glints: [...document.querySelectorAll("[data-glint]")].map(
        (el) => getComputedStyle(el).animationName,
      ),
      offset: parseFloat(
        getComputedStyle(branch.querySelector("[data-stem]")!).strokeDashoffset,
      ),
      leaves: [...branch.querySelectorAll("[data-leaf]")].map(
        (el) => getComputedStyle(el).opacity,
      ),
    };
  });
  expect(paint.reduced).toBe(true);
  expect(paint.arrival).toBe("butterfly-arrival");
  expect(paint.glints).toHaveLength(6);
  expect(paint.glints.every((name) => name.startsWith("jewel-"))).toBe(true);
  expect(paint.offset).toBeGreaterThan(100);
  expect(paint.leaves.every((opacity) => opacity === "0")).toBe(true);
  const geometry = await sceneGeometry(page);
  for (const [ratio, caption] of [
    [0.08, "Formas orgánicas · pieza conceptual"],
    [0.48, "Detalles que brillan · ilustración"],
    [0.9, "Manos que crean · esquema de encuadre"],
    [0.08, "Formas orgánicas · pieza conceptual"],
  ] as const) {
    await page.evaluate(
      ({ top, travel, ratio }) =>
        scrollTo({ top: top + travel * ratio, behavior: "instant" }),
      { ...geometry, ratio },
    );
    await expect
      .poll(async () => (await scenePaint(page)).visible)
      .toEqual([caption]);
    expect((await scenePaint(page)).bottom).toBeLessThan(1004);
  }
});

test("reading room updates when sticky content grows without viewport or scene height changing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await waitForMotionController(page);
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("sticky");
  await page.waitForTimeout(600);
  await page.locator(".inspiration-scene h2").evaluate((el) => {
    el.textContent =
      "Ideas que florecen y detalles de una creación editorial. ".repeat(7);
  });
  await expect(page.locator(".inspiration-scene")).toHaveAttribute(
    "data-scene-reason",
    "insufficient-reading-space",
  );
  expect((await scenePaint(page)).position).toBe("static");
  expect((await scenePaint(page)).visible).toHaveLength(3);
  await page.locator(".inspiration-scene h2").evaluate((el) => {
    el.textContent = "Ideas que florecen.";
  });
  await expect
    .poll(async () => (await scenePaint(page)).position)
    .toBe("sticky");
});

test("without application JavaScript all original motifs and images render in flow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/");
  expect((await scenePaint(page)).position).toBe("static");
  expect((await scenePaint(page)).visible).toHaveLength(3);
  const rendered = await page.evaluate(() => ({
    offsets: [...document.querySelectorAll(".branch-1440 [data-stem]")].map(
      (el) => parseFloat(getComputedStyle(el).strokeDashoffset),
    ),
    leaves: [...document.querySelectorAll(".branch-1440 [data-leaf]")].map(
      (el) => getComputedStyle(el).opacity,
    ),
    animations: document
      .querySelector(".butterfly-svg")!
      .getAnimations({ subtree: true }).length,
  }));
  expect(rendered.offsets.every((value) => value === 0)).toBe(true);
  expect(rendered.leaves.every((value) => value === "1")).toBe(true);
  expect(rendered.animations).toBe(0);
  await context.close();
});
