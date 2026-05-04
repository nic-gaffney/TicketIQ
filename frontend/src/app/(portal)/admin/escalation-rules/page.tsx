"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { useTickets } from "@/contexts/ticket-context";
import {
  apiFetchJson,
  type EscalationConfigDTO,
  type EscalationConfigPatch,
  type RunEscalationCheckDTO,
} from "@/lib/api-fetch";
import type { Severity, TicketStatus } from "@/lib/types";

export default function EscalationRulesPage() {
  const { toast } = useToast();
  const { adminOverride, refresh } = useTickets();

  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState<EscalationConfigDTO | null>(null);
  const [timeMin, setTimeMin] = useState(30);
  const [intervalSec, setIntervalSec] = useState(300);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const [ticketId, setTicketId] = useState("");
  const [ovSev, setOvSev] = useState<Severity>("medium");
  const [ovStatus, setOvStatus] = useState<TicketStatus>("in_progress");
  const [runBusy, setRunBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await apiFetchJson<EscalationConfigDTO>("/api/v1/admin/escalation");
      setCfg(c);
      setTimeMin(c.high_unassigned_threshold_minutes);
      setIntervalSec(c.job_interval_seconds);
      setTarget(c.notification_target);
    } catch (e: unknown) {
      toast({
        title: "Failed to load escalation config",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const body: EscalationConfigPatch = {
        high_unassigned_threshold_minutes: timeMin,
        job_interval_seconds: intervalSec,
        notification_target: target || null,
      };
      const c = await apiFetchJson<EscalationConfigDTO>("/api/v1/admin/escalation", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setCfg(c);
      toast({ title: "Configuration saved", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const runCheck = async () => {
    setRunBusy(true);
    try {
      const r = await apiFetchJson<RunEscalationCheckDTO>("/api/v1/admin/escalation/run-check", {
        method: "POST",
      });
      await refresh();
      toast({
        title: "Escalation check complete",
        description: `${r.tickets_escalated} ticket(s) escalated`,
        kind: "success",
      });
    } catch (e: unknown) {
      toast({
        title: "Run check failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    } finally {
      setRunBusy(false);
    }
  };

  const submitOverride = async () => {
    const id = Number.parseInt(ticketId.trim(), 10);
    if (!Number.isFinite(id)) {
      toast({ title: "Enter a numeric ticket ID", kind: "warning" });
      return;
    }
    const sev =
      ovSev === "critical" ? ("high" as const) : (ovSev as "low" | "medium" | "high");
    try {
      await adminOverride(id, {
        severity: sev,
        status: ovStatus,
      });
      setTicketId("");
      await refresh();
      toast({ title: "Override applied", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Override failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Escalation rules</h1>
        <p className="text-[var(--text-secondary)]">
          Thresholds and job interval from `/api/v1/admin/escalation`. Manual ticket overrides use
          admin + tech APIs.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={runBusy}
          onClick={() => void runCheck()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--brand)]/50 disabled:opacity-50"
        >
          {runBusy ? "Running…" : "Run escalation check now"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Reload config
        </button>
      </div>

      <div className="max-w-xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : cfg ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Last updated: {new Date(cfg.updated_at).toLocaleString()}
          </p>
        ) : null}
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">
            High severity unassigned threshold (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
            value={timeMin}
            onChange={(e) => setTimeMin(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">
            Background job interval (seconds)
          </label>
          <input
            type="number"
            min={60}
            max={3600}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">Notification target</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. it-manager@example.com"
          />
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void save()}
          className="w-full rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save configuration"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current configuration</h2>
        <table className="mt-4 w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="py-2 text-left">Field</th>
              <th className="py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]/60">
              <td className="py-3">High unassigned threshold (min)</td>
              <td className="py-3 font-mono">{cfg?.high_unassigned_threshold_minutes ?? "—"}</td>
            </tr>
            <tr className="border-b border-[var(--border)]/60">
              <td className="py-3">Job interval (sec)</td>
              <td className="py-3 font-mono">{cfg?.job_interval_seconds ?? "—"}</td>
            </tr>
            <tr className="border-b border-[var(--border)]/60">
              <td className="py-3">Notification target</td>
              <td className="py-3">{cfg?.notification_target ?? "—"}</td>
            </tr>
            <tr>
              <td className="py-3">Updated</td>
              <td className="py-3 font-mono text-xs">
                {cfg ? new Date(cfg.updated_at).toLocaleString() : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="max-w-xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manual ticket override</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Applies{" "}
          <code className="text-[var(--brand)]">{"PATCH /api/v1/tickets/{id}/admin"}</code> for severity and
          status.
        </p>
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
          placeholder="Ticket ID (number)"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={ovSev}
            onChange={(e) => setOvSev(e.target.value as Severity)}
          >
            {(["low", "medium", "high", "critical"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            value={ovStatus}
            onChange={(e) => setOvStatus(e.target.value as TicketStatus)}
          >
            {(["open", "assigned", "in_progress", "escalated", "resolved"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void submitOverride()}
          className="w-full rounded-lg border border-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface)]"
        >
          Submit override
        </button>
      </div>
    </div>
  );
}
