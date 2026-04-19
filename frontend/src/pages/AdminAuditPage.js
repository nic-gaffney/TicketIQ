import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/client";
export default function AdminAuditPage() {
    const [ticketId, setTicketId] = useState("");
    const q = ticketId.trim() ? Number(ticketId) : undefined;
    const { data, isLoading, error } = useQuery({
        queryKey: ["audit", q],
        queryFn: async () => {
            const { data } = await api.get("audit", {
                params: Number.isFinite(q) ? { ticket_id: q } : {},
            });
            return data;
        },
    });
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Audit log" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Escalations, overrides, status changes (admin)." }), _jsx("div", { className: "mt-4 flex gap-2", children: _jsx("input", { placeholder: "Filter by ticket id (optional)", className: "rounded-lg border border-gray-300 px-3 py-2 text-sm", value: ticketId, onChange: (e) => setTicketId(e.target.value) }) }), isLoading && _jsx("p", { className: "mt-4 text-gray-600", children: "Loading\u2026" }), error && _jsx("p", { className: "mt-4 text-red-600", children: "Could not load audit log." }), _jsx("ul", { className: "mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white text-sm shadow-sm", children: data?.map((r) => (_jsxs("li", { className: "px-4 py-3", children: [_jsx("div", { className: "font-mono text-xs text-gray-500", children: new Date(r.created_at).toLocaleString() }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold text-tmobile", children: r.action }), " \u00B7 ticket #", r.ticket_id, " \u00B7", " ", r.actor_label, r.actor_user_id != null ? ` #${r.actor_user_id}` : ""] }), _jsx("pre", { className: "mt-1 max-h-24 overflow-auto rounded bg-gray-50 p-2 text-xs", children: JSON.stringify(r.payload, null, 2) }), r.message && _jsx("div", { className: "mt-1 text-xs text-gray-600", children: r.message })] }, r.id))) })] }));
}
