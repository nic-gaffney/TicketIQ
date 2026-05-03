"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Flame, Skull, Timer, UserX } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTickets } from "@/contexts/ticket-context";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { assigneeName, avgResolutionHours } from "@/lib/ticket-helpers";
import { ticketFromApi, type Ticket } from "@/lib/types";

type Row = Ticket & { id: string };

export default function EscalatedPage() {
  const { user } = useAuth();
  const { tickets, claimTicket } = useTickets();
  const router = useRouter();

  const ticketsUi = useMemo(() => tickets.map(ticketFromApi), [tickets]);

  const esc = useMemo(
    () =>
      ticketsUi
        .filter((t) => t.status === "escalated")
        .sort((a, b) => {
          const ta = new Date(a.escalatedAt ?? a.updatedAt).getTime();
          const tb = new Date(b.escalatedAt ?? b.updatedAt).getTime();
          return ta - tb;
        }),
    [ticketsUi],
  );

  const unassigned = esc.filter((t) => !t.assignedTo).length;
  const crit = esc.filter((t) => t.severity === "high" || t.severity === "critical").length;
  const avgH = avgResolutionHours(ticketsUi);

  const [sortKey, setSortKey] = useState<"age" | "id">("age");

  const rows: Row[] = useMemo(() => {
    const r = esc.map((t) => ({ ...t, id: t.ticketId }));
    if (sortKey === "age")
      return [...r].sort(
        (a, b) =>
          new Date(a.escalatedAt ?? 0).getTime() - new Date(b.escalatedAt ?? 0).getTime(),
      );
    return r;
  }, [esc, sortKey]);

  const ageColor = (t: Ticket) => {
    const at = new Date(t.escalatedAt ?? t.updatedAt);
    const mins = (Date.now() - at.getTime()) / 60000;
    if (mins > 120) return "text-red-300";
    if (mins > 30) return "text-amber-300";
    return "text-[var(--text-secondary)]";
  };

  const columns: ColumnDef<Row>[] = [
    {
      id: "id",
      header: "Ticket ID",
      cell: (r) => (
        <button
          type="button"
          className="font-mono text-[var(--brand)] hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/tickets/${r.ticketId}`);
          }}
        >
          {r.ticketId}
        </button>
      ),
    },
    { id: "title", header: "Title", cell: (r) => r.title },
    {
      id: "sev",
      header: "Severity",
      cell: (r) => <span className="capitalize text-red-200/90">{r.severity}</span>,
    },
    { id: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      id: "age",
      header: "Age (since escalation)",
      sortable: true,
      accessor: (r) => r.escalatedAt ?? "",
      cell: (r) => (
        <span className={ageColor(r)}>
          {r.escalatedAt
            ? formatDistanceToNow(new Date(r.escalatedAt), { addSuffix: true })
            : "—"}
        </span>
      ),
    },
    { id: "region", header: "Region", cell: (r) => r.region },
    {
      id: "assign",
      header: "Assigned to",
      cell: (r) => assigneeName(r),
    },
    {
      id: "act",
      header: "Actions",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="rounded bg-[var(--brand)] px-2 py-1 text-[10px] text-white"
            onClick={(e) => {
              e.stopPropagation();
              if (user) void claimTicket(Number.parseInt(r.ticketId, 10));
            }}
          >
            Claim
          </button>
          <button
            type="button"
            className="rounded border border-[var(--border)] px-2 py-1 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tickets/${r.ticketId}`);
            }}
          >
            Open
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Escalated tickets</h1>
        <p className="text-[var(--text-secondary)]">
          Oldest-first triage for duty managers and L3 bridges.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Escalated" value={esc.length} icon={Flame} />
        <StatCard label="Unassigned" value={unassigned} icon={UserX} />
        <StatCard label="Critical" value={crit} icon={Skull} />
        <StatCard label="Avg response (hrs)" value={avgH} icon={Timer} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-secondary)]">Sort by</span>
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as "age" | "id")}
        >
          <option value="age">Age (oldest first)</option>
          <option value="id">Ticket ID</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(r) => router.push(`/tickets/${r.ticketId}`)}
      />
    </div>
  );
}
