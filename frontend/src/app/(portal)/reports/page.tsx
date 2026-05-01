"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { MOCK_AI_ACCURACY_SERIES, MOCK_WEEKLY_REPORT } from "@/lib/mock-data";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { AIAccuracyTrend } from "@/components/charts/ai-accuracy-trend";

export default function ReportsPage() {
  const [week, setWeek] = useState("current");
  const r = MOCK_WEEKLY_REPORT;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Reports</h1>
          <p className="text-[var(--text-secondary)]">Weekly executive rollup for IT leadership.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          >
            <option value="current">Current week</option>
            <option value="prev">Previous week</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Weekly summary
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Tickets closed" value={r.resolvedTickets} />
          <Metric label="Avg close time (hrs)" value={r.avgResolutionTimeHours} />
          <Metric label="Escalations" value={r.escalationCount} />
          <Metric label="SLA breach rate" value={`${(r.slaBreachRate * 100).toFixed(1)}%`} />
          <Metric label="AI accuracy" value="94%" />
          <Metric label="First contact resolution" value="81%" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 overflow-x-auto">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Team breakdown</h2>
        <table className="mt-4 w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="py-2 text-left">Team</th>
              <th className="py-2 text-left">Resolved</th>
              <th className="py-2 text-left">Avg time (h)</th>
              <th className="py-2 text-left">SLA breaches</th>
            </tr>
          </thead>
          <tbody>
            {r.teamBreakdown.map((t) => (
              <tr key={t.team} className="border-b border-[var(--border)]/60">
                <td className="py-3">{t.team}</td>
                <td className="py-3 font-mono">{t.resolved}</td>
                <td className="py-3 font-mono">{t.avgTime}</td>
                <td className="py-3 font-mono">{Math.round(t.resolved * r.slaBreachRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top categories</h3>
          <CategoryBarChart
            data={r.topCategories.map((x) => ({ category: x.category, count: x.count }))}
          />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI accuracy trend</h3>
          <AIAccuracyTrend data={MOCK_AI_ACCURACY_SERIES} />
        </div>
      </div>
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
