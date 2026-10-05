import { expect, test, type Page } from "@playwright/test";

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
      .evaluate((image) => ({
        reveal: Number(
          getComputedStyle(image).getPropertyValue("--scene-reveal"),
        ),
        clip: getComputedStyle(image.closest(".craft-art")!).clipPath,
        transform: getComputedStyle(image).transform,
      }));
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
        progress: Number(
          getComputedStyle(el).getPropertyValue("--hero-progress"),
        ),
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
          progress: Number(
            getComputedStyle(el).getPropertyValue("--hero-progress"),
          ),
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
          Number(getComputedStyle(el).getPropertyValue("--hero-progress")),
        ),
      )
      .toBeCloseTo(ratio, 2);
    for (const sample of await readFrames()) {
      expect(sample.ready).toBe(true);
      expect(sample.height).toBe(geometry.height);
      expect(sample.scroll).toBeCloseTo(Math.round(destination), 0);
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
