"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTickets } from "@/contexts/ticket-context";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { StatusPill } from "@/components/ui/status-pill";
import { PriorityScore } from "@/components/ui/priority-score";
import { assigneeName, avgResolutionHours } from "@/lib/ticket-helpers";
import type { IssueCategory, Ticket, TicketStatus } from "@/lib/types";
import {
  Activity,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Ticket as TicketIcon,
} from "lucide-react";

const PAGE = 10;

const statuses: TicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "escalated",
  "resolved",
  "archived",
];
const categories: IssueCategory[] = [
  "network",
  "software",
  "hardware",
  "account",
  "security",
  "other",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { tickets } = useTickets();

  useEffect(() => {
    if (user?.role === "technician") router.replace("/technician/queue");
    if (user?.role === "admin") router.replace("/admin/overview");
  }, [user, router]);

  const mine = useMemo(
    () => tickets.filter((t) => t.submittedBy === user?.userId),
    [tickets, user?.userId],
  );

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [catFilter, setCatFilter] = useState<IssueCategory | "all">("all");
  const [priorityMin, setPriorityMin] = useState<"all" | "high" | "mid" | "low">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return mine.filter((t) => {
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !t.ticketId.toLowerCase().includes(s) &&
          !t.title.toLowerCase().includes(s) &&
          !t.description.toLowerCase().includes(s)
        )
          return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (catFilter !== "all" && t.category !== catFilter) return false;
      if (priorityMin === "high" && t.priorityScore < 75) return false;
      if (priorityMin === "mid" && (t.priorityScore < 45 || t.priorityScore >= 75)) return false;
      if (priorityMin === "low" && t.priorityScore >= 45) return false;
      return true;
    });
  }, [mine, q, statusFilter, catFilter, priorityMin]);

  const total = mine.length;
  const openProg = mine.filter(
    (t) =>
      t.status === "open" ||
      t.status === "assigned" ||
      t.status === "in_progress" ||
      t.status === "escalated",
  ).length;
  const resolved = mine.filter((t) => t.status === "resolved" || t.status === "archived").length;
  const avgH = avgResolutionHours(mine);

  type Row = Ticket & { id: string };
  const rows: Row[] = filtered.map((t) => ({ ...t, id: t.ticketId }));

  const columns: ColumnDef<Row>[] = [
    {
      id: "id",
      header: "Ticket ID",
      sortable: true,
      accessor: (r) => r.ticketId,
      cell: (r) => (
        <span className="font-mono text-[var(--brand)]">{r.ticketId}</span>
      ),
    },
    {
      id: "title",
      header: "Issue Title",
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
      cell: (r) => (
        <span className="capitalize text-[var(--text-secondary)]">{r.category}</span>
      ),
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
      header: "Assigned IT",
      sortable: true,
      accessor: (r) => assigneeName(r),
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{assigneeName(r)}</span>
      ),
    },
    {
      id: "updated",
      header: "Last Updated",
      sortable: true,
      accessor: (r) => r.updatedAt,
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {format(new Date(r.updatedAt), "MMM d, HH:mm")}
        </span>
      ),
    },
  ];

  if (!user || user.role !== "user") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl tracking-wide text-[var(--text-primary)]">
          <LayoutDashboard className="h-8 w-8 text-[var(--brand)]" />
          User Dashboard
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Track submissions, SLA windows, and routing status across your tickets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total submitted" value={total} icon={TicketIcon} />
        <StatCard label="Open / In progress" value={openProg} icon={Activity} />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} />
        <StatCard
          label="Avg resolution time"
          value={`${avgH}h`}
          icon={Clock}
          delta="Rolling across resolved tickets"
          trend="flat"
        />
      </div>

      <div id="tickets">
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">My tickets</h2>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(0);
            }}
            placeholder="Filter table…"
            className="flex-1"
          />
        </div>

        <FilterBar
          onClear={() => {
            setStatusFilter("all");
            setCatFilter("all");
            setPriorityMin("all");
            setPage(0);
          }}
        >
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TicketStatus | "all");
              setPage(0);
            }}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value as IssueCategory | "all");
              setPage(0);
            }}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            value={priorityMin}
            onChange={(e) => {
              setPriorityMin(e.target.value as typeof priorityMin);
              setPage(0);
            }}
          >
            <option value="all">All priorities</option>
            <option value="high">High (75+)</option>
            <option value="mid">Medium (45–74)</option>
            <option value="low">Low (&lt;45)</option>
          </select>
        </FilterBar>

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={rows}
            page={page}
            pageSize={PAGE}
            onRowClick={(r) => router.push(`/tickets/${r.ticketId}`)}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
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
    </div>
  );
}
