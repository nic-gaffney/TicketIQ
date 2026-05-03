"use client";

import { useCallback, useEffect, useState } from "react";
import type { IssueCategory } from "@/lib/types";

const ALLOWED = new Set<string>([
  "network",
  "software",
  "hardware",
  "account",
  "security",
  "other",
]);

function storageKey(userId: number) {
  return `ticketiq-tech-specializations:${userId}`;
}

export const TECH_SPECS_CHANGED = "ticketiq-tech-specs-changed";

export function useTechnicianSpecializations(userId: number | undefined) {
  const [specializations, setState] = useState<IssueCategory[]>([]);

  const load = useCallback(() => {
    if (userId == null) {
      setState([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (!raw) {
        setState([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setState([]);
        return;
      }
      setState(
        parsed.filter(
          (x): x is IssueCategory =>
            typeof x === "string" && ALLOWED.has(x),
        ),
      );
    } catch {
      setState([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const on = (e: Event) => {
      const ce = e as CustomEvent<number>;
      if (ce.detail === userId) load();
    };
    window.addEventListener(TECH_SPECS_CHANGED, on as EventListener);
    return () => window.removeEventListener(TECH_SPECS_CHANGED, on as EventListener);
  }, [userId, load]);

  const setSpecializations = useCallback(
    (next: IssueCategory[]) => {
      if (userId == null) return;
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setState(next);
      window.dispatchEvent(new CustomEvent(TECH_SPECS_CHANGED, { detail: userId }));
    },
    [userId],
  );

  return { specializations, setSpecializations, reload: load };
}
