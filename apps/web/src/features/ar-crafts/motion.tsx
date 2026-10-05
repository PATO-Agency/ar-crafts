"use client";
import { useEffect } from "react";
import { branchProgress, clamp, sceneState } from "./motion-math";

export function CraftMotion() {
  useEffect(() => {
    const site = document.querySelector<HTMLElement>(".ar-site");
    if (!site) return;
    let reduced: MediaQueryList;
    let desktop: MediaQueryList;
    const heroScene = site.querySelector<HTMLElement>(".hero-scene");
    const hero = site.querySelector<HTMLElement>(".hero");
    const journeys = site.querySelector<HTMLElement>(".journeys");
    const journeyCards = Array.from(
      site.querySelectorAll<HTMLElement>(".journey-card"),
    );
    const branches = Array.from(
      site.querySelectorAll<SVGSVGElement>("svg[data-branch]"),
    );
    const scene = site.querySelector<HTMLElement>(".inspiration-scene");
    const slides = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".inspiration-slide"))
      : [];
    const steps = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".scene-step"))
      : [];
    const stories = scene
      ? Array.from(scene.querySelectorAll<HTMLElement>(".scene-story"))
      : [];
    let frame = 0;
    let disposed = false;
    let failed = false;
    let observer: ResizeObserver | undefined;
    const cleanups: Array<() => void> = [];
    const resetSlides = () => {
      slides.forEach((slide) => {
        slide.removeAttribute("aria-hidden");
        slide.removeAttribute("data-active");
        slide.removeAttribute("data-visible");
        slide.style.removeProperty("--scene-reveal");
        slide.style.removeProperty("--scene-scale");
      });
      steps.forEach((step) => step.removeAttribute("aria-current"));
      stories.forEach((story) => {
        story.removeAttribute("data-active");
        story.removeAttribute("aria-hidden");
      });
      scene?.style.removeProperty("--scene-progress");
    };
    const reset = (reason: string) => {
      site.removeAttribute("data-motion-ready");
      heroScene?.removeAttribute("data-hero-ready");
      heroScene?.style.removeProperty("--hero-progress");
      journeyCards.forEach((card) =>
        card.style.removeProperty("--journey-reveal"),
      );
      scene?.removeAttribute("data-scene-ready");
      scene?.removeAttribute("data-scene-measure");
      if (scene) scene.dataset.sceneReason = reason;
      branches.forEach((branch) => {
        branch.removeAttribute("data-grown");
        branch.querySelectorAll<SVGElement>("[data-leaf]").forEach((leaf) => {
          leaf.style.removeProperty("opacity");
          leaf.style.removeProperty("--leaf-reveal");
        });
        branch
          .querySelector<SVGPathElement>("[data-stem]")
          ?.removeAttribute("style");
      });
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
        let heroProgress: number | undefined;
        if (heroScene && hero) {
          // Pin only when the complete hero, including its controls, fits.
          const fits =
            innerWidth >= 768 &&
            innerHeight >= 600 &&
            hero.offsetHeight < innerHeight * 0.95;
          heroScene.toggleAttribute("data-hero-ready", fits);
          heroScene.dataset.heroReason = fits ? "active" : "reading-space";
          const travel = heroScene.offsetHeight - hero.offsetHeight;
          const progress = fits
            ? clamp(
                -heroScene.getBoundingClientRect().top / Math.max(1, travel),
              )
            : 0;
          heroScene.style.setProperty("--hero-progress", String(progress));
          if (fits) heroProgress = progress;
        }
        if (journeys) {
          // The section is an untransformed measurement anchor for both cards.
          const top = journeys.getBoundingClientRect().top;
          const reveal = clamp(
            (innerHeight * 0.88 - top) / (innerHeight * 0.5),
          );
          journeyCards.forEach((card, i) =>
            card.style.setProperty(
              "--journey-reveal",
              String(clamp(reveal * 1.25 - i * 0.18)),
            ),
          );
        }
        for (const branch of branches) {
          if (!branch.getBoundingClientRect().width) continue;
          const stem = branch.querySelector<SVGPathElement>("[data-stem]");
          if (!stem) throw new Error("Stem absent");
          let length = lengths.get(branch);
          if (!length) {
            length = stem.getTotalLength();
            if (!Number.isFinite(length) || length <= 0)
              throw new Error("Invalid geometry");
            lengths.set(branch, length);
            branch
              .querySelectorAll<SVGElement>("[data-leaf]")
              .forEach((leaf) => {
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
          const rect = branch.getBoundingClientRect();
          // The hero is pinned: its foliage follows the scene, not its fixed rect.
          const progress =
            branch.closest(".botanical-hero") && heroProgress !== undefined
              ? clamp(heroProgress * 1.12 + 0.04)
              : branchProgress(rect.top, rect.height, innerHeight);
          stem.style.strokeDasharray = String(length);
          stem.style.strokeDashoffset = String(length * (1 - progress));
          branch.querySelectorAll<SVGElement>("[data-leaf]").forEach((leaf) => {
            const attachment = attachments.get(leaf) ?? 0;
            const reveal = clamp(
              (progress - attachment) /
                Math.max(0.002, Math.min(0.055, 1 - attachment)),
            );
            leaf.style.opacity = String(reveal);
            leaf.style.setProperty("--leaf-reveal", String(reveal));
          });
          branch.setAttribute("data-grown", String(progress));
        }
        if (scene) {
          const sticky = scene.querySelector<HTMLElement>(
            ".inspiration-sticky",
          )!;
          let reason = !(forceMotion ? innerWidth >= 820 : desktop.matches)
            ? "viewport-width"
            : innerHeight < 600
              ? "viewport-height"
              : scene.dataset.sceneEligible !== "true" || slides.length < 3
                ? "missing-stages"
                : "active";
          if (reason === "active") {
            // Measure the candidate layout, never the previous normal/enhanced state.
            // The transient measurement attribute is removed before painting.
            scene.setAttribute("data-scene-measure", "");
            const candidateHeight = sticky.scrollHeight;
            scene.dataset.sceneHeight = String(candidateHeight);
            scene.removeAttribute("data-scene-measure");
            if (candidateHeight > innerHeight * 0.92)
              reason = "insufficient-reading-space";
          }
          scene.dataset.sceneReason = reason;
          if (reason === "active") {
            scene.setAttribute("data-scene-ready", "");
            const top = scene.getBoundingClientRect().top;
            const travel = scene.offsetHeight - sticky.offsetHeight;
            const progress = clamp(-top / Math.max(1, travel));
            scene.style.setProperty("--scene-progress", String(progress));
            const index = sceneState(top, travel, Math.min(3, slides.length));
            slides.forEach((slide, i) => {
              slide.dataset.active = String(i === index);
              const reveal =
                i === 0
                  ? 1
                  : clamp((progress - (i === 1 ? 0.12 : 0.58)) / 0.28);
              slide.dataset.visible = String(i === 0 || reveal > 0);
              slide.style.setProperty("--scene-reveal", String(reveal));
              slide.style.setProperty(
                "--scene-scale",
                String(
                  1 +
                    (1 - reveal) * 0.16 +
                    (i === index ? Math.max(0, progress - i / 3) * 0.2 : 0),
                ),
              );
              if (i < 3) slide.setAttribute("aria-hidden", String(i !== index));
            });
            stories.forEach((story, i) => {
              story.dataset.active = String(i === index);
              story.setAttribute("aria-hidden", String(i !== index));
            });
            steps.forEach((step, i) => {
              if (i === index) step.setAttribute("aria-current", "step");
              else step.removeAttribute("aria-current");
            });
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
    const listen = (target: EventTarget, event: string, capture = false) => {
      target.addEventListener(event, schedule, { passive: true, capture });
      cleanups.push(() => target.removeEventListener(event, schedule, capture));
    };
    try {
      reduced = matchMedia("(prefers-reduced-motion: reduce)");
      desktop = matchMedia("(min-width: 1024px)");
      observer = new ResizeObserver(schedule);
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
      listen(site, "toggle", true);
      listen(reduced, "change");
      listen(desktop, "change");
      document.fonts?.ready.then(schedule).catch(() => undefined);
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
