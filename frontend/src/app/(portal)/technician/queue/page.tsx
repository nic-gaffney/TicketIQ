"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Star, Timer } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTickets } from "@/contexts/ticket-context";
import { useToast } from "@/contexts/toast-context";
import { useTechnicianSpecializations } from "@/hooks/use-technician-specializations";
import { userById } from "@/lib/mock-data";
import { issueCategoryLabel } from "@/lib/category-mapping";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatCard } from "@/components/ui/stat-card";
import { TicketCard } from "@/components/tickets/ticket-card";
import { avgResolutionHours } from "@/lib/ticket-helpers";
import {
  ticketFromApi,
  type IssueCategory,
  type Severity,
  type Ticket,
  type TicketStatus,
} from "@/lib/types";
import { Activity, AlertOctagon, Flame, Timer as TimerIcon } from "lucide-react";

const REFRESH_SEC = 30;

type Row = Ticket & { id: string };

export default function TechnicianQueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tickets, claimTicket, runAutoEscalation } = useTickets();
  const { specializations } = useTechnicianSpecializations(user?.id);
  const router = useRouter();
  const [left, setLeft] = useState(REFRESH_SEC);
  const [cat, setCat] = useState<IssueCategory | "all">("all");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [reg, setReg] = useState("all");
  const [st, setSt] = useState<TicketStatus | "all">("all");

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((s) => (s <= 1 ? REFRESH_SEC : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void runAutoEscalation().catch(() => {
        /* admin-only endpoint for some roles — ignore */
      });
    }, REFRESH_SEC * 1000);
    return () => clearInterval(id);
  }, [runAutoEscalation]);

  const ticketsUi = useMemo(() => tickets.map(ticketFromApi), [tickets]);

  const openPipeline = useMemo(
    () =>
      ticketsUi
        .filter(
          (t) =>
            t.status === "open" ||
            t.status === "assigned" ||
            t.status === "in_progress" ||
            t.status === "escalated",
        )
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [ticketsUi],
  );

  const filtered = useMemo(() => {
    return openPipeline.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (sev !== "all" && t.severity !== sev) return false;
      if (reg !== "all" && t.region !== reg) return false;
      if (st !== "all" && t.status !== st) return false;
      return true;
    });
  }, [openPipeline, cat, sev, reg, st]);

  const regions = useMemo(
    () => Array.from(new Set(ticketsUi.map((t) => t.region).filter(Boolean))).sort(),
    [ticketsUi],
  );

  const best = useMemo(() => {
    if (!specializations.length) return openPipeline.slice(0, 3);
    const matched = openPipeline.filter((t) => specializations.includes(t.category));
    if (!matched.length) return [];
    return matched.slice(0, 3);
  }, [openPipeline, specializations]);

  const isBestFor = (t: Ticket) =>
    specializations.length > 0 && specializations.includes(t.category);

  const active = openPipeline.length;
  const highP = openPipeline.filter((t) => t.priorityScore >= 75).length;
  const esc = openPipeline.filter((t) => t.status === "escalated").length;
  const avgR = avgResolutionHours(ticketsUi);

  const rows: Row[] = filtered.map((t) => ({ ...t, id: t.ticketId }));

  const columns: ColumnDef<Row>[] = [
    {
      id: "id",
      header: "Ticket ID",
      sortable: true,
      accessor: (r) => r.ticketId,
      cell: (r) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 font-mono text-[var(--brand)] hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/tickets/${r.ticketId}`);
          }}
        >
          {isBestFor(r) ? <Star className="h-3.5 w-3.5 text-amber-400" /> : null}
          {r.ticketId}
        </button>
      ),
    },
    {
      id: "sub",
      header: "Submission time",
      sortable: true,
      accessor: (r) => r.createdAt,
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {format(new Date(r.createdAt), "MMM d HH:mm")}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      sortable: true,
      accessor: (r) => userById(r.submittedBy)?.name ?? "",
      cell: (r) => (
        <span>{userById(r.submittedBy)?.name ?? r.submittedBy}</span>
      ),
    },
    {
      id: "cat",
      header: "Category",
      sortable: true,
      accessor: (r) => r.category,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{issueCategoryLabel(r.category)}</span>
      ),
    },
    {
      id: "score",
      header: "AI priority",
      sortable: true,
      accessor: (r) => r.priorityScore,
      cell: (r) => (
        <span
          className={
            r.priorityScore >= 75
              ? "text-red-300"
              : r.priorityScore >= 45
                ? "text-amber-300"
                : "text-emerald-300"
          }
        >
          {r.priorityScore}
        </span>
      ),
    },
    {
      id: "region",
      header: "Region",
      sortable: true,
      accessor: (r) => r.region,
      cell: (r) => r.region,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (r) => (
        <button
          type="button"
          className="rounded-lg bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white"
          onClick={(e) => {
            e.stopPropagation();
            if (!user) return;
            void claimTicket(Number.parseInt(r.ticketId, 10)).then(() => {
              toast({ title: "Claimed", description: r.ticketId, kind: "success" });
            });
          }}
        >
          Claim
        </button>
      ),
    },
  ];

  const ringPct = (REFRESH_SEC - left) / REFRESH_SEC;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-[var(--text-primary)]">
            Prioritized ticket queue
          </h1>
          <p className="text-[var(--text-secondary)]">
            Sorted by AI-generated priority score · Auto-refresh policy checks every {REFRESH_SEC}s
          </p>
          <Link
            href="/technician/profile"
            className="mt-2 inline-block text-sm font-medium text-[var(--brand-light)] hover:underline"
          >
            Edit issue-type specializations
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14">
            <svg className="-rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(42,42,74,0.9)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="3"
                strokeDasharray={`${ringPct * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--text-primary)]">
              {left}s
            </span>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            <Timer className="mb-1 inline h-4 w-4 text-[var(--brand)]" /> Auto-refresh in{" "}
            <span className="font-mono text-[var(--text-primary)]">{left}s</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active queue" value={active} icon={Activity} />
        <StatCard label="High priority (75+)" value={highP} icon={Flame} />
        <StatCard label="Escalated" value={esc} icon={AlertOctagon} />
        <StatCard label="Avg response time (hrs)" value={avgR} icon={TimerIcon} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <FilterBar
            onClear={() => {
              setCat("all");
              setSev("all");
              setReg("all");
              setSt("all");
            }}
          >
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
              value={cat}
              onChange={(e) => setCat(e.target.value as IssueCategory | "all")}
            >
              <option value="all">Category</option>
              {(["network", "software", "hardware", "account", "security", "other"] as const).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
              value={sev}
              onChange={(e) => setSev(e.target.value as Severity | "all")}
            >
              <option value="all">Severity</option>
              {(["low", "medium", "high", "critical"] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
            >
              <option value="all">Region</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
              value={st}
              onChange={(e) => setSt(e.target.value as TicketStatus | "all")}
            >
              <option value="all">Status</option>
              {(["open", "assigned", "in_progress", "escalated"] as const).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </FilterBar>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(r) => router.push(`/tickets/${r.ticketId}`)}
          />
        </div>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Recommended for you
          </h2>
          {best.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {specializations.length === 0
                ? "Optional: set specializations on your profile to prioritize tickets that match the same issue types users pick when submitting."
                : "No tickets in the queue currently match your selected specializations."}
            </p>
          ) : (
            best.map((t) => (
              <TicketCard key={t.ticketId} ticket={t} />
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
