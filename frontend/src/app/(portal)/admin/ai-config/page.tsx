"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { cn } from "@/lib/utils";

const nav = [
  "Classification Rules",
  "SLA Settings",
  "Escalation Rules",
  "Routing Weights",
  "Retraining Schedule",
  "Reclassification Log",
] as const;

export default function AiConfigPage() {
  const [active, setActive] = useState<(typeof nav)[number]>("Classification Rules");
  const { toast } = useToast();
  const [outage, setOutage] = useState(0.72);
  const [security, setSecurity] = useState(0.88);
  const [minor, setMinor] = useState(0.35);
  const [highTh, setHighTh] = useState(0.8);
  const [medTh, setMedTh] = useState(0.5);
  const [lowTh, setLowTh] = useState(0);
  const [timeoutSec, setTimeoutSec] = useState(12);
  type SlaUnit = "hours" | "minutes";
  const [slaRows, setSlaRows] = useState<
    { sev: string; sla: number; unit: SlaUnit; esc: number }[]
  >([
    { sev: "High", sla: 4, unit: "hours", esc: 45 },
    { sev: "Medium", sla: 24, unit: "hours", esc: 120 },
    { sev: "Low", sla: 72, unit: "hours", esc: 240 },
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
        {nav.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setActive(n)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
              active === n
                ? "bg-[var(--surface)] text-white shadow-[inset_3px_0_0_0_var(--brand)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60",
            )}
          >
            {n}
          </button>
        ))}
      </nav>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">AI configuration</h1>
          <p className="text-[var(--text-secondary)]">{active}</p>
        </div>

        {active === "Classification Rules" ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Outage keyword weight</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={outage}
                onChange={(e) => setOutage(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
              <p className="font-mono text-xs text-[var(--text-primary)]">{outage.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Security keyword weight</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={security}
                onChange={(e) => setSecurity(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
              <p className="font-mono text-xs text-[var(--text-primary)]">{security.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Minor issue keyword weight</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={minor}
                onChange={(e) => setMinor(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
              <p className="font-mono text-xs text-[var(--text-primary)]">{minor.toFixed(2)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">High threshold</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 font-mono text-sm"
                  value={highTh}
                  onChange={(e) => setHighTh(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">Medium threshold</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 font-mono text-sm"
                  value={medTh}
                  onChange={(e) => setMedTh(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">Low threshold</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 font-mono text-sm"
                  value={lowTh}
                  onChange={(e) => setLowTh(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">
                Classification timeout (seconds)
              </label>
              <input
                type="number"
                className="mt-1 w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-10 text-center text-[var(--text-secondary)]">
            Panel placeholder — select &quot;Classification Rules&quot; for interactive controls.
          </div>
        )}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 overflow-x-auto">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            SLA &amp; escalation settings
          </h2>
          <table className="mt-4 w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="py-2 text-left">Severity</th>
                <th className="py-2 text-left">SLA limit</th>
                <th className="py-2 text-left">Auto-escalate after (min)</th>
              </tr>
            </thead>
            <tbody>
              {slaRows.map((row, i) => (
                <tr key={row.sev} className="border-b border-[var(--border)]/60">
                  <td className="py-3">{row.sev}</td>
                  <td className="py-3">
                    <input
                      className="w-20 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono"
                      value={row.sla}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSlaRows((prev) =>
                          prev.map((r, j) => (j === i ? { ...r, sla: v } : r)),
                        );
                      }}
                    />
                    <select
                      className="ml-2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                      value={row.unit}
                      onChange={(e) => {
                        const unit = e.target.value as "hours" | "minutes";
                        setSlaRows((prev) =>
                          prev.map((r, j) => (j === i ? { ...r, unit } : r)),
                        );
                      }}
                    >
                      <option value="hours">hours</option>
                      <option value="minutes">minutes</option>
                    </select>
                  </td>
                  <td className="py-3">
                    <input
                      className="w-24 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono"
                      value={row.esc}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSlaRows((prev) =>
                          prev.map((r, j) => (j === i ? { ...r, esc: v } : r)),
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => toast({ title: "Reset to defaults (demo)", kind: "info" })}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => toast({ title: "Cancelled", kind: "info" })}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => toast({ title: "Configuration saved (demo)", kind: "success" })}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
