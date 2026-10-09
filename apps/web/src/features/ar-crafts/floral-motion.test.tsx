// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { arCraftsFixture } from "@ar-crafts/content";
import { CraftFloralMotion } from "./floral-motion";
import type { CraftPageContent } from "./model";
import { toCraftPageContent } from "./to-page-content";

const content = toCraftPageContent(arCraftsFixture, { demo: true });
const animateDescriptor = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "animate",
);

class ObserverMock {
  static instances: ObserverMock[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(private callback: IntersectionObserverCallback) {
    ObserverMock.instances.push(this);
  }

  enter(...targets: Element[]) {
    this.callback(
      targets.map((target) => ({
        target,
        isIntersecting: true,
      })) as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

function Page({ value }: { value: CraftPageContent }) {
  return (
    <main className="ar-site">
      <section className="hero" key={value.hero.title}>
        <h1 aria-label={value.hero.title}>
          <span>{value.hero.title}</span>
        </h1>
        <p className="hero-description">{value.hero.text}</p>
        <a href="#contact">Consultar una pieza</a>
      </section>
      <CraftFloralMotion content={value} />
    </main>
  );
}

function targets(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("h1 > span, .hero-description"),
  );
}

function expectAvailable(container: HTMLElement, value = content) {
  expect(
    screen.getByRole("heading", { name: value.hero.title }).textContent,
  ).toBe(value.hero.title);
  expect(screen.getByText(value.hero.text)).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Consultar una pieza" })
      .getAttribute("href"),
  ).toBe("#contact");
  for (const node of targets(container)) {
    expect(node.hidden).toBe(false);
    expect(node.getAttribute("aria-hidden")).toBeNull();
    expect(node.style.opacity).toBe("");
    expect(node.style.visibility).toBe("");
    expect(node.style.transform).toBe("");
  }
}

let animations: { cancel: ReturnType<typeof vi.fn>; finished: Promise<void> }[];
let animate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  ObserverMock.instances = [];
  animations = [];
  animate = vi.fn(() => {
    const animation = {
      cancel: vi.fn(),
      finished: new Promise<void>(() => {}),
    };
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    writable: true,
    value: animate,
  });
  vi.stubGlobal("IntersectionObserver", ObserverMock);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (animateDescriptor) {
    Object.defineProperty(Element.prototype, "animate", animateDescriptor);
  } else {
    Reflect.deleteProperty(Element.prototype, "animate");
  }
});

describe("floral motion lifecycle", () => {
  it("replaces observed Sanity content and cancels entrances without changing copy or accessibility", () => {
    const view = render(<Page value={content} />);
    const previousTargets = targets(view.container);
    const previousObserver = ObserverMock.instances[0];
    previousObserver.enter(...previousTargets);
    const previousAnimations = [...animations];
    expect(previousAnimations).toHaveLength(previousTargets.length);
    expectAvailable(view.container);

    const updated = {
      ...content,
      hero: {
        ...content.hero,
        title: "Pedrería para tu próxima creación",
        text: "Una nueva descripción editorial desde Sanity.",
      },
    };
    view.rerender(<Page value={updated} />);
    const currentTargets = targets(view.container);
    const currentObserver = ObserverMock.instances[1];

    expect(previousObserver.disconnect).toHaveBeenCalledOnce();
    previousAnimations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalledOnce(),
    );
    previousTargets.forEach((node) => {
      expect(node.isConnected).toBe(false);
      expect(node.hasAttribute("data-floral-entered")).toBe(false);
    });
    expect(currentObserver.observe.mock.calls.map(([node]) => node)).toEqual(
      currentTargets,
    );
    expectAvailable(view.container, updated);

    // Queued entries from a disconnected observer must not touch replaced DOM.
    previousObserver.enter(...previousTargets);
    expect(animate).toHaveBeenCalledTimes(previousTargets.length);
    previousTargets.forEach((node) =>
      expect(node.hasAttribute("data-floral-entered")).toBe(false),
    );
    currentObserver.enter(...currentTargets);
    expect(animate).toHaveBeenCalledTimes(
      previousTargets.length + currentTargets.length,
    );
    expectAvailable(view.container, updated);

    const currentAnimations = animations.slice(previousAnimations.length);
    view.unmount();
    expect(currentObserver.disconnect).toHaveBeenCalledOnce();
    currentAnimations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalledOnce(),
    );
  });

  it.each(["observer", "animation", "observer throws"])(
    "leaves content and actions available when %s is unavailable",
    (failure) => {
      if (failure === "observer") {
        vi.stubGlobal("IntersectionObserver", undefined);
      } else if (failure === "animation") {
        Reflect.deleteProperty(Element.prototype, "animate");
      } else {
        vi.stubGlobal(
          "IntersectionObserver",
          class {
            constructor() {
              throw new Error("Observer unavailable");
            }
          },
        );
      }
      const view = render(<Page value={content} />);
      expectAvailable(view.container);
      expect(animate).not.toHaveBeenCalled();
      expect(
        view.container
          .querySelector(".ar-site")
          ?.hasAttribute("data-floral-motion-ready"),
      ).toBe(false);
    },
  );

  it("cancels partial entrances and restores the visible fallback if animate throws", () => {
    animate.mockImplementationOnce(() => {
      const animation = {
        cancel: vi.fn(),
        finished: new Promise<void>(() => {}),
      };
      animations.push(animation);
      return animation;
    });
    animate.mockImplementationOnce(() => {
      throw new Error("Animation unavailable");
    });
    const view = render(<Page value={content} />);
    const observer = ObserverMock.instances[0];
    expect(() => observer.enter(...targets(view.container))).not.toThrow();
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(
      view.container
        .querySelector(".ar-site")
        ?.hasAttribute("data-floral-motion-ready"),
    ).toBe(false);
    expectAvailable(view.container);
  });

  it("finishes active entrances when the tab hides and removes its listener on unmount", () => {
    const view = render(<Page value={content} />);
    ObserverMock.instances[0].enter(...targets(view.container));
    expect(animations).toHaveLength(2);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalledOnce(),
    );
    expectAvailable(view.container);
    view.unmount();
    document.dispatchEvent(new Event("visibilitychange"));
    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalledOnce(),
    );
  });

  it("runs entrances when the operating system requests reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    const view = render(<Page value={content} />);
    ObserverMock.instances[0].enter(...targets(view.container));
    expect(animate).toHaveBeenCalledTimes(2);
    expectAvailable(view.container);
  });
});
