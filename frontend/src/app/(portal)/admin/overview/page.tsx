"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTickets } from "@/contexts/ticket-context";
import { MOCK_VOLUME_SERIES, MOCK_WEEKLY_REPORT } from "@/lib/mock-data";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { SeverityDonut } from "@/components/charts/severity-donut";
import { TicketVolumeChart } from "@/components/charts/ticket-volume-chart";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { tickets, auditLogs } = useTickets();

  const kpis = useMemo(() => {
    const today = new Date().toDateString();
    const todayTickets = tickets.filter(
      (t) => new Date(t.createdAt).toDateString() === today,
    );
    const classified = tickets.filter((t) => t.aiConfidence > 0).length;
    const escalated = tickets.filter((t) => t.status === "escalated").length;
    const breaches = tickets.filter((t) => new Date(t.slaDeadline) < new Date()).length;
    const overrides = auditLogs.filter((a) => a.actionType === "override").length;
    return {
      today: todayTickets.length,
      classified,
      escalated,
      breachRate: tickets.length ? breaches / tickets.length : 0,
      overrides,
      avgClassSec: 2.4,
    };
  }, [tickets, auditLogs]);

  const catData = MOCK_WEEKLY_REPORT.topCategories.map((x) => ({
    category: x.category,
    count: x.count,
  }));

  const sevData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    tickets.forEach((t) => {
      counts[t.severity] += 1;
    });
    return [
      { name: "Low", value: counts.low },
      { name: "Medium", value: counts.medium },
      { name: "High", value: counts.high },
      { name: "Critical", value: counts.critical },
    ].filter((d) => d.value > 0);
  }, [tickets]);

  const recentEsc = auditLogs.filter((a) => a.actionType === "escalation").slice(0, 5);
  const recentOv = auditLogs.filter((a) => a.actionType === "override").slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-[var(--text-primary)]">
          Operations overview
        </h1>
        <p className="text-[var(--text-secondary)]">
          AI throughput, escalation pressure, and SLA posture across TicketIQ.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Tickets (today)" value={kpis.today} icon={Activity} />
        <StatCard label="Classified by AI" value={kpis.classified} icon={Brain} />
        <StatCard label="Escalated (active)" value={kpis.escalated} icon={AlertTriangle} />
        <StatCard
          label="SLA breach rate"
          value={`${(kpis.breachRate * 100).toFixed(1)}%`}
          icon={ShieldAlert}
        />
        <StatCard label="Manual overrides" value={kpis.overrides} icon={SlidersHorizontal} />
        <StatCard
          label="Avg classification time"
          value={`${kpis.avgClassSec}s`}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Tickets by category
          </h2>
          <CategoryBarChart data={catData} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Ticket volume (7 days)
          </h2>
          <TicketVolumeChart data={MOCK_VOLUME_SERIES} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Severity distribution
          </h2>
          <SeverityDonut data={sevData.length ? sevData : [{ name: "None", value: 1 }]} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Recent escalations
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentEsc.map((a) => (
              <li
                key={a.logId}
                className="flex justify-between gap-2 border-b border-[var(--border)]/60 py-2 last:border-0"
              >
                <Link
                  href={a.ticketId ? `/tickets/${a.ticketId}` : "#"}
                  className="font-mono text-[var(--brand)] hover:underline"
                >
                  {a.ticketId ?? "—"}
                </Link>
                <span className="text-[var(--text-secondary)]">
                  {new Date(a.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Recent manual overrides
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recentOv.map((a) => (
            <li
              key={a.logId}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/60 py-2 last:border-0"
            >
              <Badge variant="action-override">OVERRIDE</Badge>
              <Link
                href={a.ticketId ? `/tickets/${a.ticketId}` : "#"}
                className="font-mono text-[var(--brand)]"
              >
                {a.ticketId}
              </Link>
              <span className="text-xs text-[var(--text-secondary)]">{a.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
