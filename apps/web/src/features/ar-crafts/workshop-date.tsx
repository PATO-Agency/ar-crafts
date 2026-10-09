"use client";

import { useEffect, useState } from "react";
import type { WorkshopDateEdition } from "./model";

const MAX_TIMEOUT = 2_147_483_647;
const PENDING_DATE = "Próxima fecha por confirmar";

export function WorkshopDate({
  dateLabel,
  editions,
}: {
  dateLabel: string;
  editions?: WorkshopDateEdition[];
}) {
  const [current, setCurrent] = useState<{
    editions: WorkshopDateEdition[];
    serverLabel: string;
    label: string;
  }>();

  useEffect(() => {
    if (!editions) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearTimer = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const recheck = () => {
      clearTimer();
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      const edition = editions.find((item) => Date.parse(item.endsAt) > now);
      setCurrent({
        editions,
        serverLabel: dateLabel,
        label: edition?.dateLabel ?? PENDING_DATE,
      });
      if (edition) {
        timer = setTimeout(
          recheck,
          Math.min(Date.parse(edition.endsAt) - now, MAX_TIMEOUT),
        );
      }
    };
    recheck();
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [dateLabel, editions]);

  // Keep the server label for SSR, no-JS, static sources, and replaced props.
  const label =
    editions &&
    current?.editions === editions &&
    current.serverLabel === dateLabel
      ? current.label
      : dateLabel;
  return <p className="secondary">{label}</p>;
}
