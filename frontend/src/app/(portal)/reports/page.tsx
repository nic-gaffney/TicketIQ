"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import {
  apiFetchJson,
  type WeeklyEscalationsDTO,
  type WeeklyReportDTO,
} from "@/lib/api-fetch";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weekly, setWeekly] = useState<WeeklyReportDTO | null>(null);
  const [escWk, setEscWk] = useState<WeeklyEscalationsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const w = await apiFetchJson<WeeklyReportDTO>("/api/v1/reports/weekly");
      setWeekly(w);
      if (user?.role === "admin") {
        const e = await apiFetchJson<WeeklyEscalationsDTO>("/api/v1/reports/weekly-escalations");
        setEscWk(e);
      } else {
        setEscWk(null);
      }
    } catch (err: unknown) {
      toast({
        title: "Failed to load reports",
        description: err instanceof Error ? err.message : String(err),
        kind: "error",
      });
      setWeekly(null);
      setEscWk(null);
    } finally {
      setLoading(false);
    }
  }, [toast, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const deptChart = weekly
    ? Object.entries(weekly.resolved_by_department).map(([category, count]) => ({
        category,
        count,
      }))
    : [];

  const totalResolved = deptChart.reduce((s, x) => s + x.count, 0);

  const exportCsv = () => {
    if (!weekly) return;
    const header = "department,count\n";
    const body = Object.entries(weekly.resolved_by_department)
      .map(([k, v]) => `${k},${v}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticketiq-weekly-resolved.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)]">
            Weekly rollup from <code className="text-xs text-[var(--brand)]">/api/v1/reports/*</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={!weekly}
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export resolved CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : weekly ? (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Weekly summary ({weekly.period_days} days)
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Generated {format(new Date(weekly.generated_at), "PPpp")}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Tickets resolved (period)" value={totalResolved} />
              <Metric label="Currently escalated" value={weekly.currently_escalated_count} />
              <Metric
                label="Auto-escalations (7d)"
                value={escWk?.auto_escalations_last_7_days ?? "—"}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Resolved by department (assigned resolver)
            </h2>
            {deptChart.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                No resolved tickets in this window with an assignee linked to a department.
              </p>
            ) : (
              <table className="mt-4 w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 text-left">Department</th>
                    <th className="py-2 text-left">Resolved count</th>
                  </tr>
                </thead>
                <tbody>
                  {deptChart.map((row) => (
                    <tr key={row.category} className="border-b border-[var(--border)]/60">
                      <td className="py-3">{row.category}</td>
                      <td className="py-3 font-mono">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Resolved by department (chart)</h3>
            <CategoryBarChart data={deptChart.length ? deptChart : [{ category: "—", count: 0 }]} />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">No report data.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
      <p className="font-display mt-2 text-3xl text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
