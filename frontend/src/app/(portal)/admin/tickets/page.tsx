"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTickets } from "@/contexts/ticket-context";
import { ticketFromApi, type Ticket } from "@/lib/types";
import { assigneeName } from "@/lib/ticket-helpers";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PriorityScore } from "@/components/ui/priority-score";
import { StatusPill } from "@/components/ui/status-pill";

const PAGE = 15;

const SCOPES = ["all", "today", "pipeline", "escalated", "resolved"] as const;
type Scope = (typeof SCOPES)[number];

function normalizeScope(raw: string | null): Scope {
  if (raw && (SCOPES as readonly string[]).includes(raw)) return raw as Scope;
  return "all";
}

function AdminTicketsTable() {
  const searchParams = useSearchParams();
  const scope = normalizeScope(searchParams.get("scope"));
  const router = useRouter();
  const { tickets } = useTickets();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [scope]);

  const ticketsUi = useMemo(() => tickets.map(ticketFromApi), [tickets]);

  const filtered = useMemo(() => {
    const today = new Date().toDateString();
    switch (scope) {
      case "today":
        return ticketsUi.filter((t) => new Date(t.createdAt).toDateString() === today);
      case "pipeline":
        return ticketsUi.filter((t) =>
          ["open", "assigned", "in_progress", "escalated"].includes(t.status),
        );
      case "escalated":
        return ticketsUi.filter((t) => t.status === "escalated");
      case "resolved":
        return ticketsUi.filter((t) => t.status === "resolved");
      default:
        return ticketsUi;
    }
  }, [ticketsUi, scope]);

  const title = useMemo(() => {
    switch (scope) {
      case "today":
        return "Tickets created today";
      case "pipeline":
        return "Active pipeline";
      case "escalated":
        return "Escalated tickets";
      case "resolved":
        return "Resolved tickets";
      default:
        return "All tickets";
    }
  }, [scope]);

  type Row = Ticket & { id: string };
  const rows: Row[] = useMemo(
    () => filtered.map((t) => ({ ...t, id: t.ticketId })),
    [filtered],
  );

  const columns: ColumnDef<Row>[] = [
    {
      id: "id",
      header: "Ticket ID",
      sortable: true,
      accessor: (r) => r.ticketId,
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
    {
      id: "title",
      header: "Issue",
      sortable: true,
      accessor: (r) => r.title,
      cell: (r) => (
        <span className="line-clamp-2 max-w-[280px] text-[var(--text-primary)]">{r.title}</span>
      ),
    },
    {
      id: "cat",
      header: "Category",
      sortable: true,
      accessor: (r) => r.category,
      cell: (r) => <span className="capitalize text-[var(--text-secondary)]">{r.category}</span>,
    },
    {
      id: "pri",
      header: "Priority",
      sortable: true,
      accessor: (r) => r.priorityScore,
      cell: (r) => <PriorityScore score={r.priorityScore} size={44} />,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) => <StatusPill status={r.status} />,
    },
    {
      id: "assignee",
      header: "Assigned",
      sortable: true,
      accessor: (r) => assigneeName(r),
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{assigneeName(r)}</span>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      sortable: true,
      accessor: (r) => r.updatedAt,
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {format(new Date(r.updatedAt), "MMM d, HH:mm")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {rows.length} ticket{rows.length === 1 ? "" : "s"} in this view · Click a row for details
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/tickets?scope=all"
            className={`rounded-lg border px-3 py-1.5 ${scope === "all" ? "border-[var(--brand)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            All
          </Link>
          <Link
            href="/admin/tickets?scope=today"
            className={`rounded-lg border px-3 py-1.5 ${scope === "today" ? "border-[var(--brand)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            Today
          </Link>
          <Link
            href="/admin/tickets?scope=pipeline"
            className={`rounded-lg border px-3 py-1.5 ${scope === "pipeline" ? "border-[var(--brand)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            Pipeline
          </Link>
          <Link
            href="/admin/tickets?scope=escalated"
            className={`rounded-lg border px-3 py-1.5 ${scope === "escalated" ? "border-[var(--brand)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            Escalated
          </Link>
          <Link
            href="/admin/tickets?scope=resolved"
            className={`rounded-lg border px-3 py-1.5 ${scope === "resolved" ? "border-[var(--brand)] bg-[var(--surface)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
          >
            Resolved
          </Link>
          <Link href="/admin/overview" className="rounded-lg px-3 py-1.5 text-[var(--brand)] hover:underline">
            ← Overview
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pageSize={PAGE}
        onRowClick={(r) => router.push(`/tickets/${r.ticketId}`)}
      />

      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span>
          Page {page + 1} of {Math.max(1, Math.ceil(rows.length / PAGE))}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={(page + 1) * PAGE >= rows.length}
            className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-10 text-center text-[var(--text-secondary)]">
          Loading tickets…
        </div>
      }
    >
      <AdminTicketsTable />
    </Suspense>
  );
}
