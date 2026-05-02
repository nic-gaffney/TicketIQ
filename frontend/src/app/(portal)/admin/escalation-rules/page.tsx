"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { MOCK_ESCALATION_RULE, MOCK_ESCALATION_VERSIONS } from "@/lib/mock-data";
import { applySeverityOverride, useTickets } from "@/contexts/ticket-context";
import { useAuth } from "@/contexts/auth-context";
import type { Severity, TicketStatus } from "@/lib/types";

export default function EscalationRulesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const ctx = useTickets();
  const [sev, setSev] = useState<Severity>(MOCK_ESCALATION_RULE.severityThreshold);
  const [timeMin, setTimeMin] = useState(MOCK_ESCALATION_RULE.timeThresholdMinutes);
  const [intervalMin, setIntervalMin] = useState(MOCK_ESCALATION_RULE.checkIntervalMinutes);
  const [target, setTarget] = useState(MOCK_ESCALATION_RULE.notificationTarget);
  const [ticketId, setTicketId] = useState("");
  const [ovSev, setOvSev] = useState<Severity>("medium");
  const [ovStatus, setOvStatus] = useState<TicketStatus>("in_progress");
  const [reason, setReason] = useState("");

  const save = () => {
    toast({ title: "Configuration saved", description: `v${MOCK_ESCALATION_RULE.version + 1}`, kind: "success" });
  };

  const submitOverride = () => {
    if (!user || !ticketId.trim()) return;
    applySeverityOverride(ctx, ticketId.trim(), user.userId, ovSev, reason || "Manual escalation panel");
    ctx.updateTicket(ticketId.trim(), { status: ovStatus });
    toast({ title: "Override recorded", kind: "success" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Escalation rules</h1>
        <p className="text-[var(--text-secondary)]">
          Policy thresholds tied to NOC paging and manager workflows.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 max-w-xl">
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">Severity threshold</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            value={sev}
            onChange={(e) => setSev(e.target.value as Severity)}
          >
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">Time threshold (minutes)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
            value={timeMin}
            onChange={(e) => setTimeMin(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">Check interval (minutes)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono"
            value={intervalMin}
            onChange={(e) => setIntervalMin(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs uppercase text-[var(--text-secondary)]">Notification target</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option>IT Manager group</option>
            <option>IT Manager On-Call</option>
            <option>Specific user (duty roster)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-lg bg-[var(--brand)] py-2.5 text-sm font-semibold text-white"
        >
          Save configuration
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configuration version history</h2>
        <table className="mt-4 w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="py-2 text-left">Version</th>
              <th className="py-2 text-left">Timestamp</th>
              <th className="py-2 text-left">Changed by</th>
              <th className="py-2 text-left">Changes</th>
              <th className="py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ESCALATION_VERSIONS.map((v) => (
              <tr key={v.version} className="border-b border-[var(--border)]/60">
                <td className="py-3 font-mono">{v.version}</td>
                <td className="py-3 font-mono text-xs">{new Date(v.timestamp).toLocaleString()}</td>
                <td className="py-3">{v.changedBy}</td>
                <td className="py-3 text-[var(--text-secondary)]">{v.changes}</td>
                <td className="py-3">
                  <button type="button" className="text-[var(--brand)] hover:underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manual override</h2>
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
          placeholder="Ticket ID"
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
            {(
              [
                "open",
                "assigned",
                "in_progress",
                "escalated",
                "resolved",
              ] as const
            ).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          type="button"
          onClick={submitOverride}
          className="w-full rounded-lg border border-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface)]"
        >
          Submit override
        </button>
      </div>
    </div>
  );
}
