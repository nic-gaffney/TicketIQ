import Link from "next/link";
import type { Ticket } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { PriorityScore } from "@/components/ui/priority-score";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.ticketId}`}
      className="block rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card transition-all hover:-translate-y-px hover:border-[var(--brand)]/35 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-[var(--brand)]">{ticket.ticketId}</p>
          <p className="mt-1 line-clamp-2 font-medium text-[var(--text-primary)]">{ticket.title}</p>
        </div>
        <PriorityScore score={ticket.priorityScore} size={48} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={ticket.status} />
        <span className="text-xs text-[var(--text-secondary)]">{ticket.region}</span>
      </div>
    </Link>
  );
}
