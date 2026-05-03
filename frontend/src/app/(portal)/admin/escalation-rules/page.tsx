"use client";

import { useEffect, useState, useCallback } from "react";
import createClient from "openapi-fetch";
import type { paths, components } from "@/lib/api.types";
import { getStoredToken } from "@/contexts/auth-context";
import { useTickets } from "@/contexts/ticket-context";
import { useToast } from "@/contexts/toast-context";
import type { Severity, TicketStatus } from "@/lib/types";

// ── API client (same pattern as ticket-context) ───────────────────────────────
const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001",
  headers: {
    get Authorization() {
      const token = getStoredToken();
      return token ? `Bearer ${token}` : "";
    },
  },
});

type EscalationConfigOut = components["schemas"]["EscalationConfigOut"];
type EscalationConfigUpdate = components["schemas"]["EscalationConfigUpdate"];

export default function EscalationRulesPage() {
  const { toast } = useToast();
  const { tickets, adminOverride, updateTicketTech, runAutoEscalation, refresh } = useTickets();

  // ── Config state loaded from API ──────────────────────────────────────────
  const [config, setConfig] = useState<EscalationConfigOut | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [timeMin, setTimeMin] = useState(30);
  const [intervalSec, setIntervalSec] = useState(300);
  const [target, setTarget] = useState("it-manager@example.com");

  // ── Override state ────────────────────────────────────────────────────────
  const [ticketId, setTicketId] = useState("");
  const [ovSev, setOvSev] = useState<Severity>("medium");
  const [ovStatus, setOvStatus] = useState<TicketStatus>("in_progress");
  const [reason, setReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  // ── Running manual check ──────────────────────────────────────────────────
  const [runningCheck, setRunningCheck] = useState(false);

  // ── Fetch config from API on mount ────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await apiClient.GET("/api/v1/admin/escalation");
      if (error) throw new Error(JSON.stringify(error));
      setConfig(data);
      setTimeMin(data.high_unassigned_threshold_minutes);
      setIntervalSec(data.job_interval_seconds);
      setTarget(data.notification_target);
    } catch (e) {
      toast({
        title: "Failed to load escalation config",
        description: e instanceof Error ? e.message : "Unknown error",
        kind: "error",
      });
    } finally {
      setLoadingConfig(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Save config to API ────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const body: EscalationConfigUpdate = {
        high_unassigned_threshold_minutes: timeMin,
        job_interval_seconds: intervalSec,
        notification_target: target,
      };
      const { data, error } = await apiClient.PATCH("/api/v1/admin/escalation", {
        body,
      });
      if (error) throw new Error(JSON.stringify(error));
      setConfig(data);
      toast({
        title: "Configuration saved",
        description: `Threshold: ${timeMin} min — Interval: ${intervalSec}s`,
        kind: "success",
      });
    } catch (e) {
      toast({
        title: "Failed to save configuration",
        description: e instanceof Error ? e.message : "Unknown error",
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Manual escalation check ───────────────────────────────────────────────
  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      await runAutoEscalation();
      toast({
        title: "Escalation check complete",
        description: "Eligible tickets have been escalated.",
        kind: "success",
      });
    } catch (e) {
      toast({
        title: "Escalation check failed",
        description: e instanceof Error ? e.message : "Unknown error",
        kind: "error",
      });
    } finally {
      setRunningCheck(false);
    }
  };

  // ── Admin override ────────────────────────────────────────────────────────
  const submitOverride = async () => {
    const id = parseInt(ticketId.trim(), 10);
    if (!ticketId.trim() || isNaN(id)) {
      toast({ title: "Invalid ticket ID", kind: "error" });
      return;
    }
    setOverriding(true);
    try {
      await adminOverride(id, {
        severity: ovSev as components["schemas"]["Severity"],
        reason: reason || "Manual escalation panel override",
      });
      await updateTicketTech(id, { status: ovStatus as components["schemas"]["TicketStatus"] });
      await refresh();
      toast({ title: "Override recorded", kind: "success" });
      setTicketId("");
      setReason("");
    } catch (e) {
      toast({
        title: "Override failed",
        description: e instanceof Error ? e.message : "Unknown error",
        kind: "error",
      });
    } finally {
      setOverriding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Escalation rules</h1>
        <p className="text-[var(--text-secondary)]">
          Policy thresholds tied to NOC paging and manager workflows.
        </p>
      </div>

      {/* ── Config form ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 max-w-xl">
        {loadingConfig ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading configuration...</p>
        ) : (
          <>
            {/* Last updated info */}
            {config && (
              <p className="text-xs text-[var(--text-secondary)]">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </p>
            )}

            <div>
              <label className="text-xs uppercase text-[var(--text-secondary)]">
                Time threshold (minutes)
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
                value={timeMin}
                min={1}
                onChange={(e) => setTimeMin(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                High severity tickets unassigned beyond this threshold are auto-escalated.
              </p>
            </div>

            <div>
              <label className="text-xs uppercase text-[var(--text-secondary)]">
                Check interval (seconds)
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
                value={intervalSec}
                min={60}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                How often the escalation job runs. Default: 300s (5 min).
              </p>
            </div>

            <div>
              <label className="text-xs uppercase text-[var(--text-secondary)]">
                Notification target
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="it-manager@example.com"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save configuration"}
              </button>
              <button
                type="button"
                onClick={handleRunCheck}
                disabled={runningCheck}
                className="flex-1 rounded-lg border border-[var(--brand)] py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface)] disabled:opacity-50"
              >
                {runningCheck ? "Running..." : "Run check now"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Current config summary ── */}
      {config && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 max-w-xl">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Active configuration
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Severity threshold</p>
              <p className="font-mono mt-1 capitalize">High</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Time threshold</p>
              <p className="font-mono mt-1">{config.high_unassigned_threshold_minutes} min</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Check interval</p>
              <p className="font-mono mt-1">{config.job_interval_seconds}s</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Notification target</p>
              <p className="font-mono mt-1 truncate">{config.notification_target}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual override panel ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manual override</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Override severity and status for a specific ticket. Action is recorded in the audit log.
        </p>

        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
          placeholder="Ticket ID (number)"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase">Override severity</label>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={ovSev}
              onChange={(e) => setOvSev(e.target.value as Severity)}
            >
              {(["low", "medium", "high"] as const).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase">Override status</label>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={ovStatus}
              onChange={(e) => setOvStatus(e.target.value as TicketStatus)}
            >
              {(["open", "assigned", "in_progress", "escalated", "resolved"] as const).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          className="min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          placeholder="Reason for override (required for audit log)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <button
          type="button"
          onClick={submitOverride}
          disabled={overriding || !ticketId.trim()}
          className="w-full rounded-lg border border-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface)] disabled:opacity-50"
        >
          {overriding ? "Submitting..." : "Submit override"}
        </button>
      </div>

      {/* ── Escalated tickets live count ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Current escalated tickets
        </h2>
        <p className="text-4xl font-bold text-red-400">
          {tickets.filter((t) => t.status === "escalated").length}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          tickets currently in escalated status
        </p>
      </div>
    </div>
  );
}
