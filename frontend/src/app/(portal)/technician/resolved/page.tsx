"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { useTickets } from "@/contexts/ticket-context";
import { StatusPill } from "@/components/ui/status-pill";

export default function ResolvedHistoryPage() {
  const { tickets } = useTickets();
  const resolved = useMemo(
    () =>
      tickets
        .filter((t) => t.status === "resolved" || t.status === "archived")
        .sort((a, b) => (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "")),
    [tickets],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Resolved history</h1>
        <p className="text-[var(--text-secondary)]">Recently closed work orders across regions.</p>
      </div>
      <div className="space-y-2">
        {resolved.map((t) => (
          <Link
            key={t.ticketId}
            href={`/tickets/${t.ticketId}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 transition hover:border-[var(--brand)]/35"
          >
            <div>
              <span className="font-mono text-[var(--brand)]">{t.ticketId}</span>
              <p className="font-medium text-[var(--text-primary)]">{t.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={t.status} />
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {t.resolvedAt ? format(new Date(t.resolvedAt), "MMM d, yyyy") : "—"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
