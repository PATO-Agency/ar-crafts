// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { arCraftsFixture, type CraftContent } from "@ar-crafts/content";
import { WorkshopDate } from "./workshop-date";
import { toCraftPageContent } from "./to-page-content";

const now = Date.parse("2026-10-06T15:00:00Z");
const pending = "Próxima fecha por confirmar";
const schedule = [
  { endsAt: new Date(now + 1_000).toISOString(), dateLabel: "Primera fecha" },
  { endsAt: new Date(now + 3_000).toISOString(), dateLabel: "Segunda fecha" },
];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("workshop date in an open published tab", () => {
  it("keeps the server label in SSR even if the client schedule has expired", () => {
    vi.setSystemTime(now + 5_000);
    expect(
      renderToStaticMarkup(
        <WorkshopDate dateLabel="Primera fecha" editions={schedule} />,
      ),
    ).toBe('<p class="secondary">Primera fecha</p>');
  });

  it("switches at the exact end boundary and eventually uses the pending copy", () => {
    render(<WorkshopDate dateLabel="Primera fecha" editions={schedule} />);
    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByText("Primera fecha")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("Segunda fecha")).toBeTruthy();
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText(pending)).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rechecks an already expired label on hydration", () => {
    vi.setSystemTime(now + 1_000);
    render(<WorkshopDate dateLabel="Primera fecha" editions={schedule} />);
    expect(screen.getByText("Segunda fecha")).toBeTruthy();
  });

  it("suspends timers while hidden and rechecks on visibility regain", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get");
    render(<WorkshopDate dateLabel="Primera fecha" editions={schedule} />);
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(3_000));
    fireEvent(window, new Event("focus"));
    expect(screen.getByText("Primera fecha")).toBeTruthy();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByText(pending)).toBeTruthy();
  });

  it("rechecks on focus after a clock change without waiting for the old timer", () => {
    render(<WorkshopDate dateLabel="Primera fecha" editions={schedule} />);
    vi.setSystemTime(now + 3_000);
    fireEvent(window, new Event("focus"));
    expect(screen.getByText(pending)).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replaces schedules and cancels the previous timer and listeners on unmount", () => {
    const { rerender, unmount } = render(
      <WorkshopDate dateLabel="Primera fecha" editions={schedule} />,
    );
    const replacement = [
      { endsAt: new Date(now + 5_000).toISOString(), dateLabel: "Nueva fecha" },
    ];
    rerender(<WorkshopDate dateLabel="Nueva fecha" editions={replacement} />);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByText("Nueva fecha")).toBeTruthy();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns to a static label if the schedule is removed", () => {
    const { rerender } = render(
      <WorkshopDate dateLabel="Primera fecha" editions={schedule} />,
    );
    rerender(<WorkshopDate dateLabel="Fecha editorial" />);
    act(() => vi.advanceTimersByTime(5_000));
    fireEvent(window, new Event("focus"));
    expect(screen.getByText("Fecha editorial")).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("caps long delays and reschedules until the real expiry", () => {
    const maxDelay = 2_147_483_647;
    const endsAt = new Date(now + maxDelay + 1_000).toISOString();
    render(
      <WorkshopDate
        dateLabel="Fecha distante"
        editions={[{ endsAt, dateLabel: "Fecha distante" }]}
      />,
    );
    act(() => vi.advanceTimersByTime(maxDelay));
    expect(screen.getByText("Fecha distante")).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText(pending)).toBeTruthy();
  });
});

function editorialContent(): CraftContent {
  const input = structuredClone(arCraftsFixture);
  const approval = {
    contentStatus: "approved" as const,
    approvedAt: "2026-10-05T15:00:00Z",
  };
  Object.assign(input.site, approval);
  input.workshops = [{ ...input.workshops[0], ...approval }];
  const edition = {
    ...approval,
    sourceRef: "Synthetic workshop expiry test",
    id: "first",
    workshopId: input.workshops[0].id,
    startsAt: "2026-10-06T15:00:00Z",
    endsAt: "2026-10-06T16:00:00Z",
    timeZone: "America/Lima" as const,
  };
  input.editions = [
    {
      ...edition,
      id: "next",
      startsAt: "2026-10-07T15:00:00Z",
      endsAt: "2026-10-07T16:00:00Z",
    },
    edition,
    {
      ...edition,
      id: "expired",
      startsAt: "2026-10-05T15:00:00Z",
      endsAt: new Date(now).toISOString(),
    },
    { ...edition, id: "other", workshopId: "another-workshop" },
    { ...edition, id: "drafts.pending" },
    { ...edition, id: "unapproved", contentStatus: "demo" },
  ];
  return input;
}

describe("workshop date adapter", () => {
  it("passes only ordered upcoming approved editions for the same workshop with Lima labels", () => {
    const model = toCraftPageContent(editorialContent(), {
      now: new Date(now),
    });
    const workshop = model.workshops[0];
    expect(workshop.editionSchedule).toEqual([
      {
        endsAt: "2026-10-06T16:00:00Z",
        dateLabel: expect.stringMatching(
          /^6 de octubre de 2026(?:, | a las )10:00 a\.\s*m\. · hora de Lima$/,
        ),
      },
      {
        endsAt: "2026-10-07T16:00:00Z",
        dateLabel: expect.stringMatching(
          /^7 de octubre de 2026(?:, | a las )10:00 a\.\s*m\. · hora de Lima$/,
        ),
      },
    ]);
    expect(workshop.dateLabel).toBe(workshop.editionSchedule?.[0].dateLabel);
  });

  it.each([{ demo: true }, { preview: true }])(
    "keeps demo/preview static (%j)",
    (options) => {
      const model = toCraftPageContent(editorialContent(), {
        ...options,
        now: new Date(now),
      });
      const workshop = model.workshops[0];
      expect(workshop.editionSchedule).toBeUndefined();
      const { container } = render(
        <WorkshopDate
          dateLabel={workshop.dateLabel}
          editions={workshop.editionSchedule}
        />,
      );
      act(() => vi.advanceTimersByTime(86_400_000));
      fireEvent(window, new Event("focus"));
      expect(container.textContent).toBe(workshop.dateLabel);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
