import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

type Ticket = {
  id: number;
  description: string;
  affected_system: string;
  category: string;
  region: string | null;
  status: string;
  severity: string;
  urgency: string;
  priority_score: number;
  internal_notes: string | null;
  resolution_summary: string | null;
  submitted_by_id: number;
  assigned_to_id: number | null;
  created_at: string;
  updated_at?: string;
  resolved_at: string | null;
  escalated_at: string | null;
  submitter?: { full_name: string; email: string };
  assignee?: { full_name: string; email: string } | null;
};

function apiMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "detail" in d) {
      const det = (d as { detail: unknown }).detail;
      if (typeof det === "string") return det;
      if (Array.isArray(det)) {
        return det.map((x: { msg?: string }) => x.msg ?? JSON.stringify(x)).join("; ");
      }
    }
    return err.message || `Request failed (${err.response?.status ?? "?"})`;
  }
  return "Something went wrong.";
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const ticketId = useMemo(() => Number(id), [id]);

  const { data: t, isLoading, error: loadError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data } = await api.get<Ticket>(`tickets/${ticketId}`);
      return data;
    },
    enabled: Number.isFinite(ticketId),
  });

  const invalidateTicket = async () => {
    await qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    await qc.invalidateQueries({ queryKey: ["tickets"] });
  };

  const claim = useMutation({
    mutationKey: ["ticket", ticketId, "claim"],
    mutationFn: async () => {
      const { data } = await api.post<Ticket>(`tickets/${ticketId}/claim`, {});
      return data;
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidateTicket();
    },
    onError: (e) => setActionError(apiMessage(e)),
  });

  const updateTech = useMutation({
    mutationKey: ["ticket", ticketId, "tech"],
    mutationFn: async (body: { status?: string; internal_notes?: string; resolution_summary?: string }) => {
      const { data } = await api.patch<Ticket>(`tickets/${ticketId}/tech`, body);
      return data;
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidateTicket();
    },
    onError: (e) => setActionError(apiMessage(e)),
  });

  const adminPatch = useMutation({
    mutationKey: ["ticket", ticketId, "admin"],
    mutationFn: async (body: { severity?: string; status?: string }) => {
      const { data } = await api.patch<Ticket>(`tickets/${ticketId}/admin`, body);
      return data;
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidateTicket();
    },
    onError: (e) => setActionError(apiMessage(e)),
  });

  const busy = claim.isPending || updateTech.isPending || adminPatch.isPending;

  if (!Number.isFinite(ticketId)) return <p>Invalid ticket.</p>;
  if (loadError) return <p className="text-red-600">Could not load this ticket.</p>;
  if (isLoading || !t) return <p className="text-gray-600">Loading…</p>;

  const isTech = user?.role === "it_support" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>
      )}

      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Ticket #{t.id}{" "}
          <span className="text-base font-normal capitalize text-gray-600">({t.status.replace("_", " ")})</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          AI / rules: <span className="font-medium text-tmobile">{t.severity}</span> severity ·{" "}
          <span className="font-medium text-tmobile">{t.urgency}</span> urgency · priority score{" "}
          <span className="font-mono">{t.priority_score}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-900">Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Affected system</dt>
              <dd>{t.affected_system}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Category / region</dt>
              <dd>
                {t.category}
                {t.region ? ` · ${t.region}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Submitter</dt>
              <dd>{t.submitter?.full_name ?? t.submitted_by_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Assignee</dt>
              <dd>{t.assignee?.full_name ?? (t.assigned_to_id ? `#${t.assigned_to_id}` : "Unassigned")}</dd>
            </div>
            {t.resolved_at && (
              <div>
                <dt className="text-gray-500">Resolved</dt>
                <dd>{new Date(t.resolved_at).toLocaleString()}</dd>
              </div>
            )}
            {t.escalated_at && (
              <div>
                <dt className="text-gray-500">Escalated</dt>
                <dd>{new Date(t.escalated_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-sm text-gray-800">{t.description}</p>
        </section>

        {isTech && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-medium text-gray-900">Technician</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => claim.mutate()}
                className="rounded-lg bg-tmobile px-3 py-2 text-sm font-medium text-white hover:bg-tmobile-dark disabled:opacity-50"
              >
                {claim.isPending ? "Claiming…" : "Claim ticket"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => updateTech.mutate({ status: "in_progress" })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {updateTech.isPending ? "Updating…" : "Mark in progress"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const summary = window.prompt("Resolution summary (required):") ?? "";
                  updateTech.mutate({ status: "resolved", resolution_summary: summary });
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">Internal notes (not visible to user)</label>
            <textarea
              key={`notes-${t.id}-${t.updated_at ?? ""}`}
              rows={4}
              defaultValue={t.internal_notes ?? ""}
              id="internal-notes"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
              onClick={() => {
                const el = document.getElementById("internal-notes") as HTMLTextAreaElement;
                updateTech.mutate({ internal_notes: el.value });
              }}
            >
              {updateTech.isPending ? "Saving…" : "Save notes"}
            </button>
          </section>
        )}

        {isAdmin && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 md:col-span-2">
            <h3 className="font-medium text-amber-900">Admin override</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["low", "medium", "high"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  disabled={busy}
                  className="rounded border border-amber-300 bg-white px-3 py-1.5 text-sm capitalize hover:bg-amber-100 disabled:opacity-50"
                  onClick={() => adminPatch.mutate({ severity: sev })}
                >
                  Severity: {sev}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                className="rounded border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100 disabled:opacity-50"
                onClick={() => adminPatch.mutate({ status: "open" })}
              >
                Status → open
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
