"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useTickets } from "@/contexts/ticket-context";
import { MOCK_USERS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { StatCard } from "@/components/ui/stat-card";
import type { AuditLog } from "@/lib/types";
import { Activity, Shield, Zap } from "lucide-react";

function actionVariant(
  a: AuditLog["actionType"],
):
  | "action-classification"
  | "action-override"
  | "action-reassignment"
  | "action-escalation"
  | "action-closure"
  | "action-login"
  | "action-reclassification" {
  const map: Record<
    AuditLog["actionType"],
    | "action-classification"
    | "action-override"
    | "action-reassignment"
    | "action-escalation"
    | "action-closure"
    | "action-login"
    | "action-reclassification"
  > = {
    classification: "action-classification",
    override: "action-override",
    reassignment: "action-reassignment",
    escalation: "action-escalation",
    closure: "action-closure",
    login: "action-login",
    reclassification: "action-reclassification",
  };
  return map[a];
}

export default function AuditLogPage() {
  const { auditLogs } = useTickets();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE = 12;
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const overrides = auditLogs.filter((a) => a.actionType === "override").length;
    const esc = auditLogs.filter((a) => a.actionType === "escalation").length;
    const cls = auditLogs.filter((a) => a.actionType === "classification").length;
    return { total: auditLogs.length, overrides, esc, cls };
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter((a) => {
      if (q.trim()) {
        const s = q.toLowerCase();
        const blob = `${a.logId} ${a.ticketId ?? ""} ${a.reason ?? ""} ${a.oldValue ?? ""} ${a.newValue ?? ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      if (actor !== "all" && a.actorId !== actor) return false;
      if (actionFilter !== "all" && a.actionType !== actionFilter) return false;
      return true;
    });
  }, [auditLogs, q, actor, actionFilter]);

  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () => {
    const header = "timestamp,actor,action,ticketId,details\n";
    const body = filtered
      .map(
        (a) =>
          `${a.timestamp},${a.actorId},${a.actionType},${a.ticketId ?? ""},"${(a.reason ?? "").replace(/"/g, '""')}"`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "ticketiq-audit.csv";
    el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Audit log</h1>
          <p className="text-[var(--text-secondary)]">Immutable trail of AI and human actions.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--brand)]/40"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={stats.total} icon={Activity} />
        <StatCard label="Manual overrides" value={stats.overrides} icon={Shield} />
        <StatCard label="Escalations" value={stats.esc} icon={Zap} />
        <StatCard label="AI classifications" value={stats.cls} icon={Activity} />
      </div>

      <FilterBar
        onClear={() => {
          setActor("all");
          setActionFilter("all");
          setQ("");
          setPage(0);
        }}
      >
        <SearchInput value={q} onChange={setQ} placeholder="Keyword search…" className="min-w-[200px] flex-1" />
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        >
          <option value="all">All actors</option>
          {MOCK_USERS.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name}
            </option>
          ))}
          <option value="system">system</option>
        </select>
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All actions</option>
          {(
            [
              "classification",
              "override",
              "reassignment",
              "escalation",
              "closure",
              "login",
              "reclassification",
            ] as const
          ).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)]">
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Ticket ID</th>
              <th className="px-4 py-3 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((a) => (
              <Fragment key={a.logId}>
                <tr
                  className="border-b border-[var(--border)]/60 hover:bg-[var(--surface)]/40"
                >
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      aria-label="Expand"
                      className="rounded p-1 hover:bg-[var(--surface)]"
                      onClick={() =>
                        setOpenId((id) => (id === a.logId ? null : a.logId))
                      }
                    >
                      {openId === a.logId ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{a.actorId}</td>
                  <td className="px-4 py-3">
                    <Badge variant={actionVariant(a.actionType)}>
                      {a.actionType.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {a.ticketId ? (
                      <Link className="text-[var(--brand)] hover:underline" href={`/tickets/${a.ticketId}`}>
                        {a.ticketId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-[var(--text-secondary)]">
                    {a.reason ?? `${a.oldValue ?? ""} → ${a.newValue ?? ""}`}
                  </td>
                </tr>
                {openId === a.logId ? (
                  <tr className="bg-[var(--surface)]/30">
                    <td colSpan={6} className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(a, null, 2)}</pre>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-sm text-[var(--text-secondary)]">
        <span>
          Page {page + 1} / {Math.max(1, Math.ceil(filtered.length / PAGE))}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={(page + 1) * PAGE >= filtered.length}
            className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
