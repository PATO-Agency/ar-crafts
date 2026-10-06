import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { waitForMotionController } from "./motion-ready";

type SceneProbeWindow = typeof window & {
  sceneProbe: {
    take(): { writes: number; styles: number; semantic: string[] };
    stop(): void;
  };
};

test("gallery caches skip paused writes while same-stage masks and zoom keep painting", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1004 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator(".inspiration-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "");
  await page.locator('footer a[href="#galeria"]').click();
  await scene
    .locator("img")
    .evaluateAll((imgs) =>
      Promise.all(
        imgs.map((img) =>
          (img as HTMLImageElement).decode().catch(() => undefined),
        ),
      ),
    );
  const read = () =>
    scene.evaluate((el) => ({
      progress: new DOMMatrix(
        getComputedStyle(el.querySelector(".scene-progress > span")!).transform,
      ).a,
      clips: [...el.querySelectorAll(".craft-art")].map(
        (art) => getComputedStyle(art).clipPath,
      ),
      scales: [...el.querySelectorAll("img")].map(
        (img) => getComputedStyle(img).transform,
      ),
      active: [...el.querySelectorAll<HTMLElement>(".inspiration-slide")].map(
        (slide) => slide.dataset.active,
      ),
      visible: [...el.querySelectorAll<HTMLElement>(".inspiration-slide")].map(
        (slide) => slide.dataset.visible,
      ),
      current: el.querySelector('[aria-current="step"]')?.textContent,
      story: el.querySelector('.scene-story[data-active="true"]')?.textContent,
    }));
  const seek = async (progress: number) => {
    await scene.evaluate(async (el, progress) => {
      const travel =
        (el as HTMLElement).offsetHeight -
        (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight;
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY + travel * progress,
        behavior: "instant",
      });
      dispatchEvent(new Event("scroll"));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }, progress);
    await expect
      .poll(async () => (await read()).progress)
      .toBeCloseTo(progress, 3);
  };
  await seek(0.28);
  await scene.evaluate((el) => {
    const paintStyles = new Set(
      [
        ...el.querySelectorAll<HTMLElement>(
          ".craft-art, img, .scene-progress > span",
        ),
      ].map((part) => part.style),
    );
    const original = CSSStyleDeclaration.prototype.setProperty;
    let writes = 0,
      styles = 0,
      semantic: string[] = [];
    CSSStyleDeclaration.prototype.setProperty = function (...args) {
      if (paintStyles.has(this)) writes++;
      return original.apply(this, args);
    };
    const collect = (records: MutationRecord[]) => {
      for (const record of records) {
        if (record.attributeName === "style") styles++;
        else semantic.push(record.attributeName!);
      }
    };
    const observer = new MutationObserver(collect);
    observer.observe(el, {
      subtree: true,
      attributes: true,
      attributeFilter: [
        "style",
        "data-active",
        "data-visible",
        "aria-hidden",
        "aria-current",
      ],
    });
    (window as SceneProbeWindow).sceneProbe = {
      take() {
        collect(observer.takeRecords());
        const result = { writes, styles, semantic };
        writes = styles = 0;
        semantic = [];
        return result;
      },
      stop() {
        observer.disconnect();
        CSSStyleDeclaration.prototype.setProperty = original;
      },
    };
  });
  const take = () =>
    page.evaluate(() => (window as SceneProbeWindow).sceneProbe.take());
  const evidence = [];
  try {
    for (const progress of [0.28, 0.68]) {
      await seek(progress);
      const before = await read();
      await take();
      for (let i = 0; i < 3; i++) await seek(progress);
      const paused = await take();
      expect(paused).toEqual({ writes: 0, styles: 0, semantic: [] });
      await seek(progress + 0.004);
      const moving = await take(),
        after = await read();
      expect(after.active).toEqual(before.active);
      expect(after.current).toBe(before.current);
      expect(after.story).toBe(before.story);
      expect(after.clips).not.toEqual(before.clips);
      expect(after.scales).not.toEqual(before.scales);
      expect(moving.writes).toBeGreaterThan(0);
      expect(moving.styles).toBeGreaterThan(0);
      expect(moving.semantic).toEqual([]);
      await seek(progress);
      expect(await read()).toEqual(before);
      await page.screenshot({
        path: testInfo.outputPath(`003-pause-reverse-${progress}.png`),
      });
      evidence.push({ progress, paused, moving, before, after });
    }
    // Layer visibility changes inside a stage; it has a cache separate from index.
    for (const [beforeProgress, afterProgress, visible] of [
      [0.119, 0.121, ["true", "true", "false"]],
      [0.579, 0.581, ["true", "true", "true"]],
    ] as const) {
      await seek(beforeProgress);
      const before = await read();
      await take();
      await seek(afterProgress);
      const after = await read(),
        mutations = await take();
      expect(after.active).toEqual(before.active);
      expect(after.visible).toEqual(visible);
      expect(mutations.semantic).toEqual(["data-visible"]);
    }
    await seek(0.68);
    const snapshot = await read();
    const image = scene.locator("img").nth(2);
    await image.evaluate(async (el) => {
      const clone = el.cloneNode(true) as HTMLImageElement;
      clone.style.removeProperty("transform");
      el.replaceWith(clone);
      clone.dispatchEvent(new Event("load"));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await expect(image).toHaveCSS("transform", snapshot.scales[2]);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(scene).not.toHaveAttribute("data-scene-ready", "");
    await expect(scene.locator(".inspiration-slide[aria-hidden]")).toHaveCount(
      0,
    );
    expect(
      await scene
        .locator(".craft-art")
        .evaluateAll((arts) =>
          arts.every((art) => getComputedStyle(art).clipPath === "none"),
        ),
    ).toBe(true);
    expect(
      await image.evaluate((el) => (el as HTMLElement).style.transform),
    ).toBe("");
    await page.setViewportSize({ width: 1440, height: 1004 });
    await expect(scene).toHaveAttribute("data-scene-ready", "");
    await seek(0.68);
    expect(await read()).toEqual(snapshot);
    for (const progress of [0, 1]) {
      await seek(progress);
      await page.evaluate(
        async (direction) => {
          scrollBy({ top: 10 * direction, behavior: "instant" });
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        },
        progress === 0 ? -1 : 1,
      );
      await take();
      const top = await page.evaluate(() => scrollY);
      await page.evaluate(
        async ({ top, direction }) => {
          for (const offset of [10, 20, 10]) {
            scrollTo({ top: top + offset * direction, behavior: "instant" });
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
          }
        },
        { top, direction: progress === 0 ? -1 : 1 },
      );
      const clamped = await take();
      expect(clamped).toEqual({ writes: 0, styles: 0, semantic: [] });
      expect((await read()).progress).toBe(progress);
    }
    await testInfo.attach("scene-cache-work", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json",
    });
  } finally {
    await page.evaluate(() => (window as SceneProbeWindow).sceneProbe.stop());
  }
});

for (const width of [320, 390, 852, 1440]) {
  test(`botanical leaves blossom and retract at the same scroll position at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1004 });
    await page.goto("/");
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-motion-ready",
      "",
    );
    const branch = page
      .locator('svg[data-branch="1"]')
      .filter({ visible: true });
    const geometry = await branch.evaluate((el) => {
      const stem = el.querySelector<SVGPathElement>("[data-stem]")!;
      const leaf = [...el.querySelectorAll<SVGElement>("[data-leaf]")][3];
      const length = stem.getTotalLength();
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
      const rect = el.getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height, attachment };
    });
    const read = () =>
      branch.evaluate((el) => {
        const leaf = [...el.querySelectorAll<SVGElement>("[data-leaf]")][3];
        const stem = el.querySelector("[data-stem]")!;
        return {
          opacity: Number(getComputedStyle(leaf).opacity),
          transform: getComputedStyle(leaf).transform,
          offset: parseFloat(getComputedStyle(stem).strokeDashoffset),
        };
      });
    const seek = async (ratio: number) => {
      await page.evaluate(
        ({ top, height, ratio }) =>
          scrollTo({
            top:
              top - innerHeight * 0.95 + ratio * (height + innerHeight * 0.83),
            behavior: "instant",
          }),
        { ...geometry, ratio },
      );
    };
    const middle = geometry.attachment + 0.025;
    await seek(middle);
    await expect.poll(async () => (await read()).opacity).toBeGreaterThan(0.1);
    await expect.poll(async () => (await read()).opacity).toBeLessThan(0.9);
    const partial = await read();
    expect(partial.transform).not.toBe("none");
    await seek(geometry.attachment + 0.09);
    await expect.poll(async () => (await read()).opacity).toBe(1);
    expect((await read()).offset).toBeLessThan(partial.offset);
    await seek(middle);
    await expect
      .poll(async () => (await read()).opacity)
      .toBeCloseTo(partial.opacity, 2);
    expect((await read()).transform).toBe(partial.transform);
    await seek(Math.max(0, geometry.attachment - 0.03));
    await expect.poll(async () => (await read()).opacity).toBe(0);
    expect((await read()).offset).toBeGreaterThan(partial.offset);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}

test("hero foliage follows the pinned butterfly scene in both directions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.locator(".hero-scene");
  await expect(hero).toHaveAttribute("data-hero-ready", "");
  const geometry = await hero.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    travel:
      (el as HTMLElement).offsetHeight -
      (el.querySelector(".hero") as HTMLElement).offsetHeight,
  }));
  const branch = page.locator('.branch-1440[data-branch="0"]');
  const read = () =>
    branch.evaluate((el) =>
      parseFloat(
        getComputedStyle(el.querySelector("[data-stem]")!).strokeDashoffset,
      ),
    );
  const seek = async (ratio: number) =>
    page.evaluate(
      ({ top, travel, ratio }) =>
        scrollTo({ top: top + travel * ratio, behavior: "instant" }),
      { ...geometry, ratio },
    );
  const start = await read();
  await seek(0.65);
  await expect.poll(read).toBeLessThan(start * 0.4);
  await seek(0);
  await expect.poll(read).toBeCloseTo(start, 0);
});

async function setPolicy(page: Page, policy: "always" | "system") {
  await page.locator(".ar-site").evaluate((site, value) => {
    (site as HTMLElement).dataset.motionPolicy = value;
    window.dispatchEvent(new Event("resize"));
  }, policy);
}

for (const width of [320, 390, 768, 852, 1440]) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    for (const policy of ["always", "system"] as const) {
      test(`${policy} policy at ${width}px with ${reducedMotion} keeps gallery eligibility separate from animation`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width,
          height: width === 852 ? 1004 : 900,
        });
        await page.emulateMedia({ reducedMotion });
        await page.goto("/");
        await waitForMotionController(page);
        await setPolicy(page, policy);
        const animated = policy === "always" || reducedMotion !== "reduce";
        const sticky = animated && width >= (policy === "always" ? 820 : 1024);
        await expect
          .poll(() =>
            page
              .locator(".inspiration-sticky")
              .evaluate((el) => getComputedStyle(el).position),
          )
          .toBe(sticky ? "sticky" : "static");
        await expect
          .poll(() =>
            page
              .locator(".ar-site")
              .evaluate((el) => el.hasAttribute("data-motion-ready")),
          )
          .toBe(animated);
        const paint = await page.evaluate(() => {
          const branch = [
            ...document.querySelectorAll<SVGSVGElement>('svg[data-branch="1"]'),
          ].find((el) => el.getBoundingClientRect().width > 0)!;
          return {
            offset: parseFloat(
              getComputedStyle(branch.querySelector("[data-stem]")!)
                .strokeDashoffset,
            ),
            arrival: getComputedStyle(document.querySelector(".butterfly-art")!)
              .animationName,
            glints: [...document.querySelectorAll("[data-glint]")].map(
              (el) => getComputedStyle(el).animationName,
            ),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        expect(paint.overflow).toBe(false);
        if (animated) {
          expect(paint.offset).toBeGreaterThan(100);
          expect(paint.arrival).toBe("butterfly-arrival");
          expect(paint.glints).toHaveLength(6);
          expect(paint.glints.every((name) => name.startsWith("jewel-"))).toBe(
            true,
          );
        } else {
          expect(paint.offset).toBe(0);
          expect(paint.arrival).toBe("none");
          expect(paint.glints.every((name) => name === "none")).toBe(true);
        }
        if (!sticky) {
          expect(
            await page.locator(".inspiration-slide[aria-hidden=true]").count(),
          ).toBe(0);
          const images = await page
            .locator(".inspiration-slide")
            .evaluateAll((slides) =>
              slides.map((el) => ({
                top: el.getBoundingClientRect().top + scrollY,
                height: el.getBoundingClientRect().height,
                clip: getComputedStyle(el.querySelector("img")!).clipPath,
              })),
            );
          expect(images).toHaveLength(3);
          expect(
            images.every((image) => image.height > 0 && image.clip === "none"),
          ).toBe(true);
          if (width < 768) expect(images[1].top).toBeGreaterThan(images[0].top);
        }
      });
    }
  }
}

test("both upward wipes paint intermediate masks and reverse continuously", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await waitForMotionController(page);
  const scene = page.locator(".inspiration-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "");
  const geometry = await scene.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    travel:
      (el as HTMLElement).offsetHeight -
      (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight,
  }));
  const read = (index: number) =>
    scene
      .locator(".inspiration-slide img")
      .nth(index)
      .evaluate((image) => {
        const art = image.closest(".craft-art")!;
        const clip = getComputedStyle(art).clipPath;
        const inset = clip.match(
          /^inset\(([-\d.]+)(%|px)(?:\s+[-\d.]+(?:%|px)?){0,3}\)$/,
        );
        if (clip !== "none" && !inset)
          throw new Error(`Unexpected clip: ${clip}`);
        return {
          reveal:
            clip === "none"
              ? 1
              : 1 -
                Number(inset![1]) /
                  (inset![2] === "%"
                    ? 100
                    : art.getBoundingClientRect().height),
          clip,
          transform: getComputedStyle(image).transform,
        };
      });
  for (const [index, ratios] of [
    [1, [0.18, 0.26, 0.34, 0.26]],
    [2, [0.64, 0.72, 0.8, 0.72]],
  ] as const) {
    const readings: Array<Awaited<ReturnType<typeof read>>> = [];
    for (const ratio of ratios) {
      await page.evaluate(
        ({ top, travel, ratio }) =>
          scrollTo({ top: top + travel * ratio, behavior: "instant" }),
        { ...geometry, ratio },
      );
      const previous = readings.at(-1);
      await expect
        .poll(async () => (await read(index)).reveal)
        .toBeGreaterThan(0);
      if (previous)
        await expect
          .poll(async () => (await read(index)).reveal)
          .not.toBe(previous.reveal);
      const paint = await read(index);
      expect(paint.reveal).toBeLessThan(1);
      expect(paint.clip).toMatch(/^inset\(/);
      readings.push(paint);
    }
    expect(readings[1].reveal).toBeGreaterThan(readings[0].reveal);
    expect(readings[2].reveal).toBeGreaterThan(readings[1].reveal);
    expect(readings[3].reveal).toBeCloseTo(readings[1].reveal, 2);
    expect(readings[0].transform).not.toBe(readings[2].transform);
    expect(readings[3].transform).toBe(readings[1].transform);
  }
  await expect(page.locator(".scene-progress")).toHaveCount(1);
  await expect(page.locator(".scene-story[data-active=true]")).toHaveCount(1);
});

for (const width of [852, 1440]) {
  test(`gallery zoom stays continuous across stage changes in both directions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1004 });
    await page.goto("/");
    const scene = page.locator(".inspiration-scene");
    await expect(scene).toHaveAttribute("data-scene-ready", "");
    await page.evaluate(() => document.fonts.ready);
    const geometry = await scene.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      travel:
        (el as HTMLElement).offsetHeight -
        (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight,
    }));
    for (const [boundary, changesStage] of [
      [0.26, true],
      [0.72, true],
      [1 / 3, false],
      [2 / 3, false],
    ] as const) {
      const frames = [];
      for (const progress of [
        boundary - 0.0005,
        boundary + 0.0005,
        boundary - 0.0005,
      ]) {
        await page.evaluate(
          ({ top, travel, progress }) =>
            scrollTo({ top: top + travel * progress, behavior: "instant" }),
          { ...geometry, progress },
        );
        await expect
          .poll(() =>
            scene.evaluate(
              (el) =>
                new DOMMatrix(
                  getComputedStyle(el.querySelector(".scene-progress > span")!)
                    .transform,
                ).a,
            ),
          )
          .toBeCloseTo(progress, 3);
        frames.push(
          await scene.evaluate((el) => ({
            active: [
              ...el.querySelectorAll<HTMLElement>(".inspiration-slide"),
            ].findIndex((slide) => slide.dataset.active === "true"),
            scales: [...el.querySelectorAll(".inspiration-slide img")].map(
              (image) => {
                const matrix = new DOMMatrix(getComputedStyle(image).transform);
                return Math.hypot(matrix.a, matrix.b);
              },
            ),
          })),
        );
      }
      expect(frames[1].active).toBe(frames[0].active + Number(changesStage));
      for (let i = 0; i < frames[0].scales.length; i++) {
        expect(
          Math.abs(frames[1].scales[i] - frames[0].scales[i]),
        ).toBeLessThan(0.001);
        expect(frames[2].scales[i]).toBeCloseTo(frames[0].scales[i], 5);
      }
      expect(frames[2].active).toBe(frames[0].active);
    }
  });

  test(`gallery dominance, caption, story and accessibility agree through pauses and reversals at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1004 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const scene = page.locator(".inspiration-scene");
    await expect(scene).toHaveAttribute("data-scene-ready", "");
    const geometry = await scene.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      travel:
        (el as HTMLElement).offsetHeight -
        (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight,
    }));
    const read = () =>
      scene.evaluate((el) => {
        const slides = [
          ...el.querySelectorAll<HTMLElement>(".inspiration-slide"),
        ];
        // Read the actual painted masks independently of the motion helper.
        const reveals = slides.map((slide) => {
          const art = slide.querySelector(".craft-art")!;
          const clip = getComputedStyle(art).clipPath;
          if (clip === "none") return 1;
          const inset = clip.match(
            /^inset\(([-\d.]+)(%|px)(?:\s+[-\d.]+(?:%|px)?){0,3}\)$/,
          );
          if (!inset) throw new Error(`Unexpected clip: ${clip}`);
          return (
            1 -
            Number(inset[1]) /
              (inset[2] === "%" ? 100 : art.getBoundingClientRect().height)
          );
        });
        const fractions = [
          reveals[0] - reveals[1],
          reveals[1] - reveals[2],
          reveals[2],
        ];
        const indices = (
          selector: string,
          match: (element: HTMLElement) => boolean,
        ) =>
          [...el.querySelectorAll<HTMLElement>(selector)].flatMap(
            (element, i) => (match(element) ? [i] : []),
          );
        const rendered = (element: HTMLElement) => {
          const style = getComputedStyle(element);
          return (
            style.display !== "none" &&
            style.visibility === "visible" &&
            Number(style.opacity) > 0 &&
            element.getBoundingClientRect().height > 0
          );
        };
        return {
          progress: new DOMMatrix(
            getComputedStyle(el.querySelector(".scene-progress > span")!)
              .transform,
          ).a,
          fractions,
          active: indices(
            ".inspiration-slide",
            (slide) => slide.dataset.active === "true",
          ),
          accessible: indices(
            ".inspiration-slide",
            (slide) => slide.getAttribute("aria-hidden") === "false",
          ),
          visibleLayers: indices(
            ".inspiration-slide",
            (slide) => slide.dataset.visible === "true",
          ),
          captions: indices(".inspiration-slide figcaption", rendered),
          story: indices(
            ".scene-story",
            (story) => story.dataset.active === "true",
          ),
          accessibleStory: indices(
            ".scene-story",
            (story) => story.getAttribute("aria-hidden") === "false",
          ),
          renderedStory: indices(".scene-story", rendered),
          current: indices(
            ".scene-step",
            (step) => step.getAttribute("aria-current") === "step",
          ),
          indicator: new DOMMatrix(
            getComputedStyle(el.querySelector(".scene-progress > span")!)
              .transform,
          ).a,
          scales: slides.map(
            (slide) =>
              new DOMMatrix(
                getComputedStyle(slide.querySelector("img")!).transform,
              ).a,
          ),
        };
      });
    const stops = [
      [0, 0],
      [0.2595, 0],
      [0.2605, 1],
      [0.28, 1],
      [0.68, 1],
      [0.7195, 1],
      [0.7205, 2],
      [1, 2],
    ] as const;
    const snapshots = new Map<number, Awaited<ReturnType<typeof read>>>();
    const evidence = [];
    for (const [direction, positions] of [
      ["forward", stops],
      ["reverse", [...stops].reverse()],
      [
        "jump",
        [
          [1, 2],
          [0, 0],
          [1, 2],
          [0.68, 1],
          [0.28, 1],
        ],
      ],
    ] as const) {
      for (const [progress, index] of positions) {
        await page.evaluate(
          ({ top, travel, progress }) =>
            scrollTo({ top: top + travel * progress, behavior: "instant" }),
          { ...geometry, progress },
        );
        await expect
          .poll(async () => (await read()).progress)
          .toBeCloseTo(progress, 3);
        const paint = await read();
        expect(paint.fractions.every(Number.isFinite)).toBe(true);
        const dominant = paint.fractions.reduce(
          (winner, fraction, i, all) => (fraction >= all[winner] ? i : winner),
          0,
        );
        expect(dominant).toBe(index);
        for (const state of [
          paint.active,
          paint.accessible,
          paint.captions,
          paint.story,
          paint.accessibleStory,
          paint.renderedStory,
          paint.current,
        ])
          expect(state).toEqual([index]);
        expect(paint.indicator).toBeCloseTo(paint.progress, 5);
        if (progress === 0.28) {
          expect(paint.visibleLayers).toEqual([0, 1]);
          expect(paint.fractions[1]).toBeCloseTo(4 / 7, 2);
        }
        if (progress === 0.68) {
          expect(paint.visibleLayers).toEqual([0, 1, 2]);
          expect(paint.fractions[2]).toBeCloseTo(5 / 14, 2);
        }
        if (direction === "forward") snapshots.set(progress, paint);
        else expect(paint).toEqual(snapshots.get(progress));
        evidence.push({
          direction,
          requested: progress,
          expected: index,
          ...paint,
        });
        if (
          direction !== "jump" &&
          (progress === 0.28 ||
            progress === 0.68 ||
            (direction === "forward" && progress > 0 && progress < 1))
        ) {
          await page.screenshot({
            path: testInfo.outputPath(`${width}-${direction}-${progress}.png`),
          });
        }
      }
    }
    const evidencePath = testInfo.outputPath(`${width}-dominance.json`);
    writeFileSync(
      evidencePath,
      JSON.stringify(
        { viewport: { width, height: 1004 }, geometry, evidence },
        null,
        2,
      ),
    );
    await testInfo.attach("dominance-pauses-and-reversals", {
      path: evidencePath,
      contentType: "application/json",
    });
  });
}

test("gallery resets after resize and policy changes, and internal links restore its current position", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1004 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator(".inspiration-scene");
  const seekDetail = async () => {
    await expect(scene).toHaveAttribute("data-scene-ready", "");
    await scene.evaluate((el) => {
      const travel =
        (el as HTMLElement).offsetHeight -
        (el.querySelector(".inspiration-sticky") as HTMLElement).offsetHeight;
      scrollTo({
        top: el.getBoundingClientRect().top + scrollY + travel * 0.68,
        behavior: "instant",
      });
    });
    await expect(scene.locator('.scene-step[aria-current="step"]')).toHaveText(
      "02 · Detalle",
    );
    await expect(
      scene.locator('.inspiration-slide[aria-hidden="false"]'),
    ).toHaveCount(1);
  };
  const expectFlow = async (reason: string) => {
    await expect(scene).toHaveAttribute("data-scene-reason", reason);
    await expect(scene).not.toHaveAttribute("data-scene-ready", "");
    await expect(
      scene.locator(
        ".inspiration-slide[aria-hidden], .inspiration-slide[data-active], .inspiration-slide[data-visible], .scene-step[aria-current], .scene-story[aria-hidden]",
      ),
    ).toHaveCount(0);
    const paint = await scene.evaluate((el) => ({
      position: getComputedStyle(el.querySelector(".inspiration-sticky")!)
        .position,
      progress: (el.querySelector(".scene-progress > span") as HTMLElement)
        .style.transform,
      figures: [...el.querySelectorAll<HTMLElement>(".inspiration-slide")].map(
        (slide) => ({
          reveal: (slide.querySelector(".craft-art") as HTMLElement).style
            .clipPath,
          scale: (slide.querySelector("img") as HTMLElement).style.transform,
          clip: getComputedStyle(slide.querySelector(".craft-art")!).clipPath,
          transform: getComputedStyle(slide.querySelector("img")!).transform,
          caption: getComputedStyle(slide.querySelector("figcaption")!)
            .visibility,
          height: slide.getBoundingClientRect().height,
        }),
      ),
    }));
    expect(paint.position).toBe("static");
    expect(paint.progress).toBe("");
    expect(paint.figures).toHaveLength(3);
    for (const figure of paint.figures) {
      expect(figure).toMatchObject({
        reveal: "",
        scale: "",
        clip: "none",
        transform: "none",
        caption: "visible",
      });
      expect(figure.height).toBeGreaterThan(0);
    }
  };
  await seekDetail();
  await page.setViewportSize({ width: 390, height: 844 });
  await expectFlow("viewport-width");
  await page.getByRole("link", { name: "Inspiración", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("390-844-flow.png") });
  await page.setViewportSize({ width: 1440, height: 500 });
  await expectFlow("viewport-height");
  await page.setViewportSize({ width: 1440, height: 1004 });
  await seekDetail();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setPolicy(page, "system");
  await expectFlow("reduced-motion");
  await setPolicy(page, "always");
  await seekDetail();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await setPolicy(page, "system");
  await seekDetail();
  await page
    .getByRole("link", { name: "AR crafts · inicio", exact: true })
    .click();
  await expect
    .poll(() =>
      scene.evaluate(
        (el) =>
          new DOMMatrix(
            getComputedStyle(el.querySelector(".scene-progress > span")!)
              .transform,
          ).a,
      ),
    )
    .toBe(0);
  await page.getByRole("link", { name: "Inspiración", exact: true }).click();
  await expect(page).toHaveURL(/#galeria$/);
  await expect(scene.locator('.scene-step[aria-current="step"]')).toHaveText(
    "01 · Pieza",
  );
});

test("the pinned hero scales and rotates with scroll, then restores its original transform", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.locator(".hero-scene");
  await expect(hero).toHaveAttribute("data-hero-ready", "");
  const geometry = await hero.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    travel:
      (el as HTMLElement).offsetHeight -
      (el.querySelector(".hero") as HTMLElement).offsetHeight,
  }));
  const read = () =>
    hero.evaluate((el) => {
      const svg = el.querySelector(".butterfly-svg")!;
      const transform = new DOMMatrix(getComputedStyle(svg).transform);
      return {
        progress: (Math.hypot(transform.a, transform.b) - 1) / 0.28,
        scale: Math.hypot(transform.a, transform.b),
        angle: Math.atan2(transform.b, transform.a),
        transform: getComputedStyle(svg).transform,
        headingTop: el.querySelector("h1")!.getBoundingClientRect().top,
        heroBottom: el.querySelector(".hero")!.getBoundingClientRect().bottom,
      };
    });
  const readings: Array<Awaited<ReturnType<typeof read>>> = [];
  for (const ratio of [0.1, 0.65, 0.1]) {
    await page.evaluate(
      ({ top, travel, ratio }) =>
        scrollTo({ top: top + travel * ratio, behavior: "instant" }),
      { ...geometry, ratio },
    );
    await expect
      .poll(async () => (await read()).progress)
      .toBeCloseTo(ratio, 2);
    const paint = await read();
    expect(paint.headingTop).toBeGreaterThan(0);
    expect(paint.heroBottom).toBeLessThan(1000);
    readings.push(paint);
  }
  expect(readings[1].scale).toBeGreaterThan(readings[0].scale);
  expect(readings[1].angle).toBeLessThan(readings[0].angle);
  expect(readings[2].transform).toBe(readings[0].transform);
});

test("a hero barely fitting the viewport stays pinned without scroll or layout oscillation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const hero = page.locator(".hero-scene");
  const baseline = await page
    .locator(".hero")
    .evaluate((el) => (el as HTMLElement).offsetHeight);
  const viewportHeight = Math.ceil(baseline / 0.95) + 5;
  await page.setViewportSize({ width: 1440, height: viewportHeight });
  await expect(hero).toHaveAttribute("data-hero-ready", "");
  const geometry = await hero.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    height: (el as HTMLElement).offsetHeight,
    travel:
      (el as HTMLElement).offsetHeight -
      (el.querySelector(".hero") as HTMLElement).offsetHeight,
  }));
  const readFrames = () =>
    hero.evaluate(async (el) => {
      const samples = [];
      for (let frame = 0; frame < 12; frame++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const bounds = (selector: string) => {
          const r = el.querySelector(selector)!.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        };
        samples.push({
          ready: el.hasAttribute("data-hero-ready"),
          height: (el as HTMLElement).offsetHeight,
          scroll: scrollY,
          progress: (() => {
            const m = new DOMMatrix(
              getComputedStyle(el.querySelector(".butterfly-svg")!).transform,
            );
            return (Math.hypot(m.a, m.b) - 1) / 0.28;
          })(),
          heading: bounds("h1"),
          actions: bounds(".hero-actions"),
        });
      }
      return samples;
    });
  let forwardTransform = "";
  for (const ratio of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95, 0.1]) {
    const destination = geometry.top + geometry.travel * ratio;
    await page.evaluate(
      (top) => scrollTo({ top, behavior: "instant" }),
      destination,
    );
    await expect
      .poll(() =>
        hero.evaluate((el) =>
          (() => {
            const m = new DOMMatrix(
              getComputedStyle(el.querySelector(".butterfly-svg")!).transform,
            );
            return (Math.hypot(m.a, m.b) - 1) / 0.28;
          })(),
        ),
      )
      .toBeCloseTo(ratio, 2);
    const actualDestination = await page.evaluate(() => scrollY);
    expect(Math.abs(actualDestination - destination)).toBeLessThanOrEqual(1);
    for (const sample of await readFrames()) {
      expect(sample.ready).toBe(true);
      expect(sample.height).toBe(geometry.height);
      expect(sample.scroll).toBe(actualDestination);
      expect(sample.progress).toBeCloseTo(ratio, 2);
      expect(sample.heading.top).toBeGreaterThanOrEqual(0);
      expect(sample.heading.bottom).toBeLessThan(viewportHeight);
      expect(sample.actions.top).toBeGreaterThanOrEqual(0);
      expect(sample.actions.bottom).toBeLessThan(viewportHeight);
    }
    const transform = await page
      .locator(".butterfly-svg")
      .evaluate((el) => getComputedStyle(el).transform);
    if (ratio === 0.1 && !forwardTransform) forwardTransform = transform;
    else if (ratio === 0.1) expect(transform).toBe(forwardTransform);
  }
});

test("journey cards reveal in sequence, settle in view, and reset under system reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".ar-site")).toHaveAttribute(
    "data-motion-ready",
    "",
  );
  const sectionTop = await page
    .locator(".journeys")
    .evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const read = () =>
    page.locator(".journey-card").evaluateAll((cards) =>
      cards.map((el) => {
        const style = getComputedStyle(el);
        return {
          y: new DOMMatrix(style.transform).m42,
          opacity: Number(style.opacity),
          reveal: style.getPropertyValue("--journey-reveal").trim(),
        };
      }),
    );
  await page.evaluate(
    (top) => scrollTo({ top: top - innerHeight * 0.68, behavior: "instant" }),
    sectionTop,
  );
  await expect.poll(async () => (await read())[0].opacity).toBeGreaterThan(0.4);
  const partial = await read();
  expect(partial).toHaveLength(2);
  expect(partial[0].y).toBeGreaterThan(0);
  expect(partial[1].y).toBeGreaterThan(partial[0].y);
  expect(partial[0].opacity).toBeGreaterThan(partial[1].opacity);
  await page.evaluate(
    (top) => scrollTo({ top: top - innerHeight * 0.2, behavior: "instant" }),
    sectionTop,
  );
  await expect
    .poll(async () =>
      (await read()).every((card) => card.y === 0 && card.opacity === 1),
    )
    .toBe(true);
  const settled = await read();
  await page.evaluate(async () => {
    for (let i = 0; i < 12; i++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
  });
  expect(await read()).toEqual(settled);
  await page.evaluate(
    (top) => scrollTo({ top: top - innerHeight * 0.68, behavior: "instant" }),
    sectionTop,
  );
  await expect.poll(async () => (await read())[1].y).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setPolicy(page, "system");
  await expect(page.locator(".ar-site")).not.toHaveAttribute(
    "data-motion-ready",
    "",
  );
  expect(
    (await read()).every(
      (card) => card.y === 0 && card.opacity === 1 && card.reveal === "",
    ),
  ).toBe(true);
});

for (const width of [359, 360]) {
  test(`the ${width}px botanical breakpoint paints exactly one branch family`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".ar-site")).toHaveAttribute(
      "data-motion-ready",
      "",
    );
    const branches = await page
      .locator('svg[data-branch="1"]')
      .evaluateAll((els) =>
        els
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => ({
            family: el.getAttribute("class"),
            offset: parseFloat(
              getComputedStyle(el.querySelector("[data-stem]")!)
                .strokeDashoffset,
            ),
          })),
      );
    expect(branches).toHaveLength(1);
    expect(branches[0].family).toContain(
      width < 360 ? "branch-320" : "branch-390",
    );
    expect(branches[0].offset).toBeGreaterThan(100);
  });
}
