"use client";

import { useEffect } from "react";
import type { CraftPageContent } from "./model";

const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
const targets = [
  ".hero h1 > span, .hero h1 > em",
  "h2 .motion-line",
  ".hero-description, .section-heading > p:not(.eyebrow)",
  ".contact-garden > p:not(.eyebrow):not(.secondary)",
  ".craft-card > .craft-art, .essence > .craft-art, .gallery-extra .craft-art",
  ".floral-accent",
].join(",");

export function CraftFloralMotion({ content }: { content: CraftPageContent }) {
  useEffect(() => {
    const site = document.querySelector<HTMLElement>(".ar-site");
    if (!site || !window.IntersectionObserver || !Element.prototype.animate)
      return;

    const animations = new Set<Animation>();
    const observed = new Set<Element>();
    let observer: IntersectionObserver | undefined;
    let disposed = false;
    const finish = () => {
      // A finite entrance must not wait for the visitor to return to the tab.
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const animate = (
      node: Element,
      frames: Keyframe[],
      duration: number,
      delay = 0,
    ) => {
      const animation = node.animate(frames, {
        duration,
        delay,
        easing: ease,
        fill: "backwards",
      });
      animations.add(animation);
      animation.finished
        .catch(() => undefined)
        .finally(() => animations.delete(animation));
    };
    const reveal = (node: Element) => {
      if (document.hidden) return;
      if (node.matches(".floral-accent")) {
        const stem = node.querySelector("[data-floral-stem]");
        const petals = node.querySelector("[data-floral-petals]");
        if (stem)
          animate(
            stem,
            [
              { strokeDasharray: "1", strokeDashoffset: "1" },
              { strokeDasharray: "1", strokeDashoffset: "0" },
            ],
            800,
          );
        if (petals)
          animate(
            petals,
            [
              { opacity: 0.25, transform: "scale(0.9) rotate(-5deg)" },
              { opacity: 1, transform: "scale(1) rotate(0deg)" },
            ],
            520,
            120,
          );
      } else if (node.matches(".craft-art")) {
        // Animate the frame, leaving image transforms to hover or the gallery.
        animate(
          node,
          [
            { opacity: 0.5, clipPath: "inset(0 0 12% 0 round 16px)" },
            { opacity: 1, clipPath: "inset(0 0 0 0 round 16px)" },
          ],
          680,
        );
      } else {
        const heading = node.matches(".motion-line, .hero h1 > *");
        const index = heading
          ? Array.from(node.parentElement!.children)
              .filter((child) => child.matches(".motion-line, span, em"))
              .indexOf(node)
          : 0;
        animate(
          node,
          [
            { opacity: 0.4, transform: `translateY(${heading ? 12 : 6}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          heading ? 560 : 420,
          Math.min(Math.max(0, index) * 60, 120),
        );
      }
    };
    const visibility = () => {
      if (document.hidden) finish();
    };
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (disposed) return;
          try {
            entries.forEach(({ target, isIntersecting }) => {
              if (!isIntersecting) return;
              observer?.unobserve(target);
              target.setAttribute("data-floral-entered", "");
              reveal(target);
            });
          } catch {
            finish();
            observer?.disconnect();
            site.removeAttribute("data-floral-motion-ready");
          }
        },
        { threshold: 0.08 },
      );
      site.querySelectorAll(targets).forEach((node) => {
        observed.add(node);
        observer!.observe(node);
      });
      site.setAttribute("data-floral-motion-ready", "");
      document.addEventListener("visibilitychange", visibility);
    } catch {
      finish();
      observer?.disconnect();
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      finish();
      observed.forEach((node) => node.removeAttribute("data-floral-entered"));
      site.removeAttribute("data-floral-motion-ready");
    };
  }, [content]);
  return null;
}
