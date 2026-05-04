"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { useTickets } from "@/contexts/ticket-context";
import type { components } from "@/lib/api.types";
import { ticketFromApi } from "@/lib/types";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { SeverityDonut } from "@/components/charts/severity-donut";
import { TicketVolumeChart } from "@/components/charts/ticket-volume-chart";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";

type AuditRow = components["schemas"]["AuditLogOut"];

function payloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function last7DayVolume(tickets: { createdAt: string }[]) {
  const keys: string[] = [];
  const counts = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    counts.set(key, 0);
  }
  for (const t of tickets) {
    const key = t.createdAt.slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((k) => ({
    day: format(new Date(`${k}T12:00:00`), "EEE M/d"),
    tickets: counts.get(k) ?? 0,
  }));
}

export default function AdminOverviewPage() {
  const { tickets, auditLogs } = useTickets();

  const ticketsUi = useMemo(() => tickets.map(ticketFromApi), [tickets]);

  const kpis = useMemo(() => {
    const today = new Date().toDateString();
    const todayTickets = ticketsUi.filter((t) => new Date(t.createdAt).toDateString() === today);
    const pipeline = ticketsUi.filter((t) =>
      ["open", "assigned", "in_progress", "escalated"].includes(t.status),
    );
    const escalated = ticketsUi.filter((t) => t.status === "escalated").length;
    const resolved = ticketsUi.filter((t) => t.status === "resolved").length;
    const overrides = (auditLogs as AuditRow[]).filter((a) => a.action === "ADMIN_OVERRIDE").length;
    return {
      today: todayTickets.length,
      pipeline: pipeline.length,
      escalated,
      resolved,
      overrides,
    };
  }, [ticketsUi, auditLogs]);

  const catData = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ticketsUi) {
      const c = t.category;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([category, count]) => ({ category, count }));
  }, [ticketsUi]);

  const volumeData = useMemo(() => last7DayVolume(ticketsUi), [ticketsUi]);

  const sevData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const t of ticketsUi) {
      const s = t.severity;
      if (s === "low") counts.low += 1;
      else if (s === "medium") counts.medium += 1;
      else if (s === "high") counts.high += 1;
      else counts.critical += 1;
    }
    return [
      { name: "Low", value: counts.low },
      { name: "Medium", value: counts.medium },
      { name: "High", value: counts.high },
      { name: "Critical", value: counts.critical },
    ].filter((d) => d.value > 0);
  }, [ticketsUi]);

  const recentEsc = useMemo(() => {
    return (auditLogs as AuditRow[])
      .filter(
        (a) =>
          a.action === "AUTO_ESCALATE" ||
          (a.action === "STATUS_CHANGE" &&
            String(payloadRecord(a.payload).new_status ?? "") === "escalated"),
      )
      .slice(0, 6);
  }, [auditLogs]);

  const recentOv = useMemo(() => {
    return (auditLogs as AuditRow[]).filter((a) => a.action === "ADMIN_OVERRIDE").slice(0, 6);
  }, [auditLogs]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-[var(--text-primary)]">
          Operations overview
        </h1>
        <p className="text-[var(--text-secondary)]">
          Live ticket and audit metrics from the TicketIQ API (last load / refresh).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Tickets created today"
          value={kpis.today}
          icon={Activity}
          href="/admin/tickets?scope=today"
        />
        <StatCard
          label="Active pipeline"
          value={kpis.pipeline}
          icon={Brain}
          href="/admin/tickets?scope=pipeline"
        />
        <StatCard
          label="Escalated (current)"
          value={kpis.escalated}
          icon={AlertTriangle}
          href="/admin/tickets?scope=escalated"
        />
        <StatCard
          label="Resolved (in list)"
          value={kpis.resolved}
          icon={CheckCircle2}
          href="/admin/tickets?scope=resolved"
        />
        <StatCard
          label="Admin overrides (audit)"
          value={kpis.overrides}
          icon={SlidersHorizontal}
          href="/admin/audit-log"
        />
        <StatCard
          label="Total tickets (loaded)"
          value={ticketsUi.length}
          icon={Clock}
          href="/admin/tickets?scope=all"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tickets by category</h2>
          <CategoryBarChart data={catData.length ? catData : [{ category: "—", count: 0 }]} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            New tickets (last 7 days)
          </h2>
          <TicketVolumeChart data={volumeData} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Severity distribution</h2>
          <SeverityDonut data={sevData.length ? sevData : [{ name: "None", value: 1 }]} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent escalations (audit)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentEsc.length === 0 ? (
              <li className="text-[var(--text-secondary)]">No escalation audit rows yet.</li>
            ) : (
              recentEsc.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between gap-2 border-b border-[var(--border)]/60 py-2 last:border-0"
                >
                  <Link
                    href={`/tickets/${a.ticket_id}`}
                    className="font-mono text-[var(--brand)] hover:underline"
                  >
                    {a.ticket_id}
                  </Link>
                  <span className="text-[var(--text-secondary)]">
                    {format(new Date(a.created_at), "MMM d, HH:mm")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent admin overrides</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recentOv.length === 0 ? (
            <li className="text-[var(--text-secondary)]">No admin override audit rows yet.</li>
          ) : (
            recentOv.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/60 py-2 last:border-0"
              >
                <Badge variant="action-override">ADMIN_OVERRIDE</Badge>
                <Link href={`/tickets/${a.ticket_id}`} className="font-mono text-[var(--brand)]">
                  {a.ticket_id}
                </Link>
                <span className="max-w-md truncate text-xs text-[var(--text-secondary)]">
                  {a.message ?? JSON.stringify(a.payload)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
