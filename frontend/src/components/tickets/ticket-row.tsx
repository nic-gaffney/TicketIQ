import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PriorityScore } from "@/components/ui/priority-score";
import { StatusPill } from "@/components/ui/status-pill";

/** Dense table row variant for ticket queues */
export function TicketRow({
  ticket,
  onClick,
  children,
  className,
}: {
  ticket: Ticket;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "table-row-interactive border-b border-[var(--border)]/60 transition-colors hover:bg-[var(--surface)]/50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <td className="px-4 py-3 font-mono text-[var(--brand)]">{ticket.ticketId}</td>
      <td className="max-w-[240px] truncate px-4 py-3 text-[var(--text-primary)]">{ticket.title}</td>
      <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{ticket.category}</td>
      <td className="px-4 py-3">
        <PriorityScore score={ticket.priorityScore} size={40} />
      </td>
      <td className="px-4 py-3">
        <StatusPill status={ticket.status} />
      </td>
      {children}
    </tr>
  );
}
