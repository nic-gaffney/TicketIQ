"use client";

import { format } from "date-fns";
import { Circle } from "lucide-react";
import type { TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const order: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "escalated",
  "resolved",
  "archived",
];

const labels: Record<TicketStatus, string> = {
  open: "Submitted",
  assigned: "Assigned",
  in_progress: "In progress",
  escalated: "Escalated",
  resolved: "Resolved",
  archived: "Archived",
};

export function TicketStatusTimeline({
  status,
  createdAt,
  updatedAt,
  escalatedAt,
  resolvedAt,
}: {
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  escalatedAt?: string;
  resolvedAt?: string;
}) {
  const idx = order.indexOf(status);
  const steps = order.slice(0, idx + 1);

  const timeFor = (s: TicketStatus) => {
    if (s === "open") return createdAt;
    if (s === "escalated") return escalatedAt ?? updatedAt;
    if (s === "resolved" || s === "archived") return resolvedAt ?? updatedAt;
    return updatedAt;
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)]/60 p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Status timeline</h3>
      <ol className="relative mt-4 space-y-4 border-l border-[var(--border)] pl-6">
        {steps.map((s, i) => (
          <li key={s} className="relative">
            <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] ring-2 ring-[var(--border)]">
              <Circle className="h-3 w-3 fill-[var(--brand)] text-[var(--brand)]" />
            </span>
            <p className="text-sm font-medium text-[var(--text-primary)]">{labels[s]}</p>
            <p className="font-mono text-xs text-[var(--text-secondary)]">
              {format(new Date(timeFor(s)), "MMM d, yyyy HH:mm")}
            </p>
            {i < steps.length - 1 ? (
              <div className={cn("absolute left-[-25px] top-8 h-full w-px bg-[var(--border)]")} />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
