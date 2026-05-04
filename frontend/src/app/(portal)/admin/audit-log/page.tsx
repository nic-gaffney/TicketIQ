"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useTickets } from "@/contexts/ticket-context";
import type { components } from "@/lib/api.types";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { StatCard } from "@/components/ui/stat-card";
import { Activity, Shield, Zap } from "lucide-react";

type AuditRow = components["schemas"]["AuditLogOut"];

function badgeVariantForAction(
  action: string,
):
  | "action-classification"
  | "action-override"
  | "action-reassignment"
  | "action-escalation"
  | "action-closure"
  | "action-login"
  | "action-reclassification" {
  const u = action.toUpperCase();
  if (u.includes("ADMIN") || u === "ADMIN_OVERRIDE") return "action-override";
  if (u.includes("AUTO_ESCAL") || u.includes("ESCAL")) return "action-escalation";
  if (u.includes("CLAIM") || u === "ASSIGN") return "action-reassignment";
  if (u.includes("CREATED")) return "action-classification";
  if (u.includes("RESOLV") || u === "IN_PROGRESS" || u === "STATUS_CHANGE") return "action-closure";
  return "action-login";
}

export default function AuditLogPage() {
  const { auditLogs } = useTickets();
  const rows = auditLogs as AuditRow[];

  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE = 12;
  const [openId, setOpenId] = useState<number | null>(null);

  const actionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const a of rows) s.add(a.action);
    return Array.from(s).sort();
  }, [rows]);

  const actorOptions = useMemo(() => {
    const s = new Set<string>();
    for (const a of rows) {
      if (a.actor_user_id != null) s.add(String(a.actor_user_id));
      else s.add("system");
    }
    return Array.from(s).sort();
  }, [rows]);

  const stats = useMemo(() => {
    const overrides = rows.filter((a) => a.action === "ADMIN_OVERRIDE").length;
    const esc = rows.filter(
      (a) => a.action === "AUTO_ESCALATE" || a.action.includes("ESCAL"),
    ).length;
    const cls = rows.filter((a) => a.action === "CREATED" || a.action.includes("CLASS")).length;
    return { total: rows.length, overrides, esc, cls };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (q.trim()) {
        const s = q.toLowerCase();
        const blob = `${a.id} ${a.ticket_id} ${a.action} ${a.actor_label} ${JSON.stringify(a.payload)} ${a.message ?? ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      const actorKey = a.actor_user_id != null ? String(a.actor_user_id) : "system";
      if (actor !== "all" && actorKey !== actor) return false;
      if (actionFilter !== "all" && a.action !== actionFilter) return false;
      return true;
    });
  }, [rows, q, actor, actionFilter]);

  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () => {
    const header = "id,created_at,actor_user_id,actor_label,action,ticket_id,message\n";
    const body = filtered
      .map((a) => {
        const msg = (a.message ?? "").replace(/"/g, '""');
        return `${a.id},${a.created_at},${a.actor_user_id ?? ""},${a.actor_label},${a.action},${a.ticket_id},"${msg}"`;
      })
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
          <p className="text-[var(--text-secondary)]">Immutable trail from `/api/v1/audit`.</p>
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
        <StatCard label="Admin overrides" value={stats.overrides} icon={Shield} />
        <StatCard label="Escalation-related" value={stats.esc} icon={Zap} />
        <StatCard label="Created / classify" value={stats.cls} icon={Activity} />
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
          {actorOptions.map((id) => (
            <option key={id} value={id}>
              {id === "system" ? "System" : `User #${id}`}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All actions</option>
          {actionOptions.map((a) => (
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
              <th className="px-4 py-3 text-left">Ticket</th>
              <th className="px-4 py-3 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((a) => (
              <Fragment key={a.id}>
                <tr className="border-b border-[var(--border)]/60 hover:bg-[var(--surface)]/40">
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      aria-label="Expand"
                      className="rounded p-1 hover:bg-[var(--surface)]"
                      onClick={() => setOpenId((id) => (id === a.id ? null : a.id))}
                    >
                      {openId === a.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {a.actor_user_id != null ? `#${a.actor_user_id}` : "—"}{" "}
                    <span className="text-[var(--text-secondary)]">({a.actor_label})</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={badgeVariantForAction(a.action)}>{a.action}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <Link className="text-[var(--brand)] hover:underline" href={`/tickets/${a.ticket_id}`}>
                      {a.ticket_id}
                    </Link>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-[var(--text-secondary)]">
                    {a.message ?? "—"}
                  </td>
                </tr>
                {openId === a.id ? (
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
