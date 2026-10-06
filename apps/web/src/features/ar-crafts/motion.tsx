"use client";
import { useEffect } from "react";
import { branchProgress, clamp, sceneTimeline } from "./motion-math";

export function CraftMotion() {
  useEffect(() => {
    const site = document.querySelector<HTMLElement>(".ar-site");
    if (!site) return;
    let reduced: MediaQueryList;
    let desktop: MediaQueryList;
    const heroScene = site.querySelector<HTMLElement>(".hero-scene");
    const hero = site.querySelector<HTMLElement>(".hero");
    const heroSvg = hero?.querySelector<SVGSVGElement>(".butterfly-svg");
    const heroCopy = hero?.querySelector<HTMLElement>(".hero-copy");
    const heroOrbit = hero?.querySelector<SVGElement>("[data-butterfly-orbit]");
    const journeys = site.querySelector<HTMLElement>(".journeys");
    const journeyCards = Array.from(
      site.querySelectorAll<HTMLElement>(".journey-card"),
    );
    const branches = Array.from(
      site.querySelectorAll<SVGSVGElement>("svg[data-branch]"),
    );
    const branchParts = branches.map((branch) => ({
      branch,
      stem: branch.querySelector<SVGPathElement>("[data-stem]"),
      leaves: Array.from(branch.querySelectorAll<SVGElement>("[data-leaf]")),
      inHero: Boolean(branch.closest(".botanical-hero")),
    }));
    const scene = site.querySelector<HTMLElement>(".inspiration-scene");
    const sticky = scene?.querySelector<HTMLElement>(".inspiration-sticky");
    const slides = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".inspiration-slide"))
      : [];
    const steps = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".scene-step"))
      : [];
    const stories = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".scene-story"))
      : [];
    const progressBar = scene?.querySelector<HTMLElement>(
      ".scene-progress > span",
    );
    const slideParts = slides.map((slide) => ({
      slide,
      art: slide.querySelector<HTMLElement>(".craft-art"),
      image: slide.querySelector<HTMLImageElement>(".craft-art img"),
    }));
    type PaintNode = HTMLElement | SVGElement;
    type PaintProperty =
      | "transform"
      | "opacity"
      | "clip-path"
      | "--journey-reveal"
      | "stroke-dasharray"
      | "stroke-dashoffset"
      | "--leaf-reveal";
    const ownedPaint = new Map<PaintNode, Set<PaintProperty>>();
    const paintValues = new Map<PaintNode, Map<PaintProperty, string>>();
    const branchProgresses = new Map<SVGSVGElement, number>();
    const dasharraysApplied = new Set<SVGPathElement>();
    const visibleFlags = new Map<HTMLElement, boolean>();
    let sceneIndex: number | undefined;
    let scenePainted = false;
    let resetReason: string | undefined;
    const attribute = (
      node: Element | null | undefined,
      name: string,
      value: string | null,
    ) => {
      if (!node || node.getAttribute(name) === value) return;
      if (value === null) node.removeAttribute(name);
      else node.setAttribute(name, value);
    };
    const paint = (
      node: PaintNode | null | undefined,
      property: PaintProperty,
      value: string,
    ) => {
      if (!node?.isConnected) return;
      let values = paintValues.get(node);
      if (values?.get(property) === value) return;
      node.style.setProperty(property, value);
      if (!values) {
        values = new Map();
        paintValues.set(node, values);
      }
      values.set(property, value);
      let properties = ownedPaint.get(node);
      if (!properties) {
        properties = new Set();
        ownedPaint.set(node, properties);
      }
      properties.add(property);
    };
    const clearPaint = (
      node: PaintNode | null | undefined,
      properties: PaintProperty[],
    ) => {
      if (!node) return;
      const owned = ownedPaint.get(node);
      properties.forEach((property) => {
        paintValues.get(node)?.delete(property);
        if (owned?.delete(property)) node.style.removeProperty(property);
      });
      if (paintValues.get(node)?.size === 0) paintValues.delete(node);
      if (owned?.size === 0) ownedPaint.delete(node);
    };
    const refreshSlideParts = (refresh: boolean) => {
      slideParts.forEach((parts) => {
        if (refresh || (parts.art !== null && !parts.art.isConnected)) {
          const art = parts.slide.querySelector<HTMLElement>(".craft-art");
          if (art !== parts.art) clearPaint(parts.art, ["clip-path"]);
          parts.art = art;
        }
        if (refresh || (parts.image !== null && !parts.image.isConnected)) {
          const image =
            parts.art?.querySelector<HTMLImageElement>("img") ?? null;
          if (image !== parts.image) clearPaint(parts.image, ["transform"]);
          parts.image = image;
        }
      });
    };
    const resetHero = () => {
      clearPaint(heroSvg, ["transform"]);
      clearPaint(heroCopy, ["transform", "opacity"]);
      clearPaint(heroOrbit, ["transform"]);
    };
    let frame = 0;
    let disposed = false;
    let failed = false;
    let layoutDirty = true;
    let candidateHeight = 0;
    let observer: ResizeObserver | undefined;
    const cleanups: Array<() => void> = [];
    const resetSlides = () => {
      if (!scenePainted) return;
      scenePainted = false;
      sceneIndex = undefined;
      visibleFlags.clear();
      refreshSlideParts(true);
      slides.forEach((slide) => {
        slide.removeAttribute("aria-hidden");
        slide.removeAttribute("data-active");
        slide.removeAttribute("data-visible");
      });
      slideParts.forEach(({ art, image }) => {
        clearPaint(art, ["clip-path"]);
        clearPaint(image, ["transform"]);
      });
      steps.forEach((step) => step.removeAttribute("aria-current"));
      stories.forEach((story) => {
        story.removeAttribute("data-active");
        story.removeAttribute("aria-hidden");
      });
      clearPaint(progressBar, ["transform"]);
    };
    const reset = (reason: string) => {
      if (resetReason === reason) return;
      resetReason = reason;
      site.removeAttribute("data-motion-ready");
      heroScene?.removeAttribute("data-hero-ready");
      resetHero();
      journeyCards.forEach((card) => clearPaint(card, ["--journey-reveal"]));
      scene?.removeAttribute("data-scene-ready");
      scene?.removeAttribute("data-scene-measure");
      attribute(scene, "data-scene-reason", reason);
      branchParts.forEach(({ branch, stem, leaves }) => {
        attribute(branch, "data-grown", null);
        leaves.forEach((leaf) =>
          clearPaint(leaf, ["opacity", "--leaf-reveal"]),
        );
        clearPaint(stem, ["stroke-dasharray", "stroke-dashoffset"]);
      });
      branchProgresses.clear();
      dasharraysApplied.clear();
      resetSlides();
    };
    const fallback = () => {
      failed = true;
      reset("initialization-failure");
    };
    const lengths = new Map<SVGSVGElement, number>();
    const attachments = new Map<SVGElement, number>();
    const update = () => {
      frame = 0;
      if (disposed || failed) return;
      try {
        const forceMotion = site.dataset.motionPolicy === "always";
        if (reduced.matches && !forceMotion) {
          reset("reduced-motion");
          return;
        }
        resetReason = undefined;
        let heroProgress: number | undefined;
        if (heroScene && hero) {
          // Pin only when the complete hero, including its controls, fits.
          const fits =
            innerWidth >= 768 &&
            innerHeight >= 600 &&
            hero.offsetHeight < innerHeight * 0.95;
          attribute(heroScene, "data-hero-ready", fits ? "" : null);
          attribute(
            heroScene,
            "data-hero-reason",
            fits ? "active" : "reading-space",
          );
          const travel = heroScene.offsetHeight - hero.offsetHeight;
          const progress = fits
            ? clamp(
                -heroScene.getBoundingClientRect().top / Math.max(1, travel),
              )
            : 0;
          if (fits) heroProgress = progress;
        }
        let sceneReason = !(forceMotion ? innerWidth >= 820 : desktop.matches)
          ? "viewport-width"
          : innerHeight < 600
            ? "viewport-height"
            : !sticky ||
                scene?.dataset.sceneEligible !== "true" ||
                slides.length < 3
              ? "missing-stages"
              : "active";
        if (scene && sticky) {
          if (sceneReason === "active") {
            // Candidate layout only changes on resize, fonts or content changes.
            // Avoid forcing its layout again on every scroll frame.
            if (layoutDirty) {
              scene.setAttribute("data-scene-measure", "");
              candidateHeight = sticky.scrollHeight;
              attribute(scene, "data-scene-height", String(candidateHeight));
              scene.removeAttribute("data-scene-measure");
            }
            if (candidateHeight > innerHeight * 0.92)
              sceneReason = "insufficient-reading-space";
          }
          attribute(
            scene,
            "data-scene-ready",
            sceneReason === "active" ? "" : null,
          );
          attribute(scene, "data-scene-reason", sceneReason);
        }
        refreshSlideParts(layoutDirty);
        layoutDirty = false;
        // Read the complete layout before writing any per-frame paint styles.
        const journeyTop = journeys?.getBoundingClientRect().top;
        const layout =
          innerWidth < 360
            ? "320"
            : innerWidth < 768
              ? "390"
              : innerWidth < 1024
                ? "768"
                : "1440";
        const branchBounds = branchParts
          .filter(({ branch }) => branch.dataset.layout === layout)
          .map((parts) => ({
            ...parts,
            rect: parts.branch.getBoundingClientRect(),
          }));
        const sceneTop = scene?.getBoundingClientRect().top ?? 0;
        const sceneTravel =
          scene && sticky ? scene.offsetHeight - sticky.offsetHeight : 0;
        if (heroProgress !== undefined) {
          paint(
            heroSvg,
            "transform",
            `translateY(${heroProgress * -32}px) rotate(${heroProgress * -7}deg) scale(${1 + heroProgress * 0.28})`,
          );
          paint(heroCopy, "transform", `translateY(${heroProgress * -24}px)`);
          paint(heroCopy, "opacity", String(1 - heroProgress * 0.25));
          paint(heroOrbit, "transform", `rotate(${heroProgress * 12}deg)`);
        } else resetHero();
        if (journeys) {
          // The section is an untransformed measurement anchor for both cards.
          const reveal = clamp(
            (innerHeight * 0.88 - journeyTop!) / (innerHeight * 0.5),
          );
          journeyCards.forEach((card, i) =>
            paint(
              card,
              "--journey-reveal",
              String(clamp(reveal * 1.25 - i * 0.18)),
            ),
          );
        }
        for (const { branch, stem, leaves, inHero, rect } of branchBounds) {
          if (!rect.width) continue;
          if (!stem) throw new Error("Stem absent");
          let length = lengths.get(branch);
          if (!length) {
            length = stem.getTotalLength();
            if (!Number.isFinite(length) || length <= 0)
              throw new Error("Invalid geometry");
            lengths.set(branch, length);
            leaves.forEach((leaf) => {
              const x = Number(leaf.dataset.attachX),
                y = Number(leaf.dataset.attachY);
              let closest = Infinity,
                ratio = 0;
              for (let sample = 0; sample <= 160; sample++) {
                const point = stem.getPointAtLength((length! * sample) / 160);
                const distance = (x - point.x) ** 2 + (y - point.y) ** 2;
                if (distance < closest) {
                  closest = distance;
                  ratio = sample / 160;
                }
              }
              attachments.set(leaf, ratio);
            });
          }
          // The hero is pinned: its foliage follows the scene, not its fixed rect.
          const progress =
            inHero && heroProgress !== undefined
              ? clamp(heroProgress * 1.12 + 0.04)
              : branchProgress(rect.top, rect.height, innerHeight);
          if (!dasharraysApplied.has(stem)) {
            paint(stem, "stroke-dasharray", String(length));
            dasharraysApplied.add(stem);
          }
          if (branchProgresses.get(branch) === progress) continue;
          paint(stem, "stroke-dashoffset", String(length * (1 - progress)));
          leaves.forEach((leaf) => {
            const attachment = attachments.get(leaf) ?? 0;
            const reveal = clamp(
              (progress - attachment) /
                Math.max(0.002, Math.min(0.055, 1 - attachment)),
            );
            paint(leaf, "opacity", String(reveal));
            paint(leaf, "--leaf-reveal", String(reveal));
          });
          attribute(branch, "data-grown", String(progress));
          branchProgresses.set(branch, progress);
        }
        if (scene) {
          if (sceneReason === "active") {
            scenePainted = true;
            const { progress, reveals, scales, index } = sceneTimeline(
              sceneTop,
              sceneTravel,
            );
            paint(progressBar, "transform", `scaleX(${progress})`);
            const indexChanged = sceneIndex !== index;
            slideParts.forEach(({ slide, art, image }, i) => {
              if (indexChanged) {
                attribute(slide, "data-active", String(i === index));
                if (i < 3) attribute(slide, "aria-hidden", String(i !== index));
              }
              const reveal = reveals[i];
              const visible = i === 0 || reveal > 0;
              if (visibleFlags.get(slide) !== visible) {
                attribute(slide, "data-visible", String(visible));
                visibleFlags.set(slide, visible);
              }
              paint(art, "clip-path", `inset(${(1 - reveal) * 100}% 0 0)`);
              paint(image, "transform", `scale(${scales[i]})`);
            });
            if (indexChanged) {
              stories.forEach((story, i) => {
                attribute(story, "data-active", String(i === index));
                attribute(story, "aria-hidden", String(i !== index));
              });
              steps.forEach((step, i) =>
                attribute(step, "aria-current", i === index ? "step" : null),
              );
              sceneIndex = index;
            }
          } else {
            scene.removeAttribute("data-scene-ready");
            resetSlides();
          }
        }
        if (!site.hasAttribute("data-motion-ready"))
          site.setAttribute("data-motion-ready", "");
      } catch {
        fallback();
      }
    };
    const schedule = () => {
      if (!frame && !disposed && !failed) frame = requestAnimationFrame(update);
    };
    const invalidateLayout = () => {
      layoutDirty = true;
      paintValues.clear();
      branchProgresses.clear();
      dasharraysApplied.clear();
      sceneIndex = undefined;
      visibleFlags.clear();
      schedule();
    };
    const listen = (target: EventTarget, event: string, capture = false) => {
      const handler = event === "scroll" ? schedule : invalidateLayout;
      target.addEventListener(event, handler, { passive: true, capture });
      cleanups.push(() => target.removeEventListener(event, handler, capture));
    };
    try {
      reduced = matchMedia("(prefers-reduced-motion: reduce)");
      desktop = matchMedia("(min-width: 1024px)");
      observer = new ResizeObserver(invalidateLayout);
      observer.observe(site);
      if (hero) observer.observe(hero);
      if (scene) {
        observer.observe(scene);
        const sticky = scene.querySelector(".inspiration-sticky");
        if (sticky) observer.observe(sticky);
      }
      site
        .querySelectorAll("main > section")
        .forEach((section) => observer!.observe(section));
      listen(window, "scroll");
      listen(window, "resize");
      listen(site, "load", true);
      listen(site, "error", true);
      listen(site, "toggle", true);
      listen(reduced, "change");
      listen(desktop, "change");
      document.fonts?.ready.then(invalidateLayout).catch(() => undefined);
      schedule();
    } catch {
      fallback();
    }
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      reset("not-initialized");
    };
  }, []);
  return null;
}
