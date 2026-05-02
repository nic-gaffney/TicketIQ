"use client";

import { differenceInMinutes, differenceInSeconds, formatDuration, intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SLATimer({ deadlineIso }: { deadlineIso: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const deadline = new Date(deadlineIso);
  const now = new Date();
  const mins = differenceInMinutes(deadline, now);
  const secs = differenceInSeconds(deadline, now) % 60;
  const breached = mins < 0;

  const urgent = !breached && mins < 60;

  let text = "";
  if (breached) {
    const dur = intervalToDuration({ start: deadline, end: now });
    text = `Breached ${formatDuration(dur)} ago`;
  } else {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    text = `${h}h ${m}m remaining`;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 font-mono text-sm",
        breached && "border-red-500/50 bg-red-950/30 text-red-200",
        urgent && !breached && "border-red-500/40 bg-red-950/20 text-red-100",
        !urgent && !breached && "border-[var(--border)] bg-[var(--surface)]/60 text-[var(--text-primary)]",
      )}
    >
      <span className="text-[var(--text-secondary)]">SLA </span>
      {text}
      {!breached ? (
        <span className="ml-2 text-xs text-[var(--text-secondary)]">
          :{String(secs).padStart(2, "0")}
        </span>
      ) : null}
    </div>
  );
}
