import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/client";

type Row = {
  id: number;
  ticket_id: number;
  actor_user_id: number | null;
  actor_label: string;
  action: string;
  payload: Record<string, unknown>;
  message: string | null;
  created_at: string;
};

export default function AdminAuditPage() {
  const [ticketId, setTicketId] = useState("");
  const q = ticketId.trim() ? Number(ticketId) : undefined;
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit", q],
    queryFn: async () => {
      const { data } = await api.get<Row[]>("audit", {
        params: Number.isFinite(q) ? { ticket_id: q } : {},
      });
      return data;
    },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Audit log</h2>
      <p className="mt-1 text-sm text-gray-600">Escalations, overrides, status changes (admin).</p>
      <div className="mt-4 flex gap-2">
        <input
          placeholder="Filter by ticket id (optional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
        />
      </div>
      {isLoading && <p className="mt-4 text-gray-600">Loading…</p>}
      {error && <p className="mt-4 text-red-600">Could not load audit log.</p>}
      <ul className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white text-sm shadow-sm">
        {data?.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="font-mono text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
            <div>
              <span className="font-semibold text-tmobile">{r.action}</span> · ticket #{r.ticket_id} ·{" "}
              {r.actor_label}
              {r.actor_user_id != null ? ` #${r.actor_user_id}` : ""}
            </div>
            <pre className="mt-1 max-h-24 overflow-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(r.payload, null, 2)}
            </pre>
            {r.message && <div className="mt-1 text-xs text-gray-600">{r.message}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
