import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
export default function TicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const qc = useQueryClient();
    const ticketId = Number(id);
    const { data: t, isLoading } = useQuery({
        queryKey: ["ticket", ticketId],
        queryFn: async () => {
            const { data } = await api.get(`tickets/${ticketId}`);
            return data;
        },
        enabled: Number.isFinite(ticketId),
    });
    const claim = useMutation({
        mutationFn: () => api.post(`tickets/${ticketId}/claim`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket", ticketId] }),
    });
    const updateTech = useMutation({
        mutationFn: (body) => api.patch(`tickets/${ticketId}/tech`, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket", ticketId] }),
    });
    const adminPatch = useMutation({
        mutationFn: (body) => api.patch(`tickets/${ticketId}/admin`, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket", ticketId] }),
    });
    if (!Number.isFinite(ticketId))
        return _jsx("p", { children: "Invalid ticket." });
    if (isLoading || !t)
        return _jsx("p", { className: "text-gray-600", children: "Loading\u2026" });
    const isTech = user?.role === "it_support" || user?.role === "admin";
    const isAdmin = user?.role === "admin";
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-semibold text-gray-900", children: ["Ticket #", t.id, " ", _jsxs("span", { className: "text-base font-normal capitalize text-gray-600", children: ["(", t.status.replace("_", " "), ")"] })] }), _jsxs("p", { className: "mt-1 text-sm text-gray-500", children: ["AI / rules: ", _jsx("span", { className: "font-medium text-tmobile", children: t.severity }), " severity \u00B7", " ", _jsx("span", { className: "font-medium text-tmobile", children: t.urgency }), " urgency \u00B7 priority score", " ", _jsx("span", { className: "font-mono", children: t.priority_score })] })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Details" }), _jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Affected system" }), _jsx("dd", { children: t.affected_system })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Category / region" }), _jsxs("dd", { children: [t.category, t.region ? ` · ${t.region}` : ""] })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Submitter" }), _jsx("dd", { children: t.submitter?.full_name ?? t.submitted_by_id })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Assignee" }), _jsx("dd", { children: t.assignee?.full_name ?? (t.assigned_to_id ? `#${t.assigned_to_id}` : "Unassigned") })] }), t.resolved_at && (_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Resolved" }), _jsx("dd", { children: new Date(t.resolved_at).toLocaleString() })] })), t.escalated_at && (_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Escalated" }), _jsx("dd", { children: new Date(t.escalated_at).toLocaleString() })] }))] }), _jsx("p", { className: "mt-4 text-sm text-gray-800", children: t.description })] }), isTech && (_jsxs("section", { className: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm", children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Technician" }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => claim.mutate(), className: "rounded-lg bg-tmobile px-3 py-2 text-sm font-medium text-white hover:bg-tmobile-dark", children: "Claim ticket" }), _jsx("button", { type: "button", onClick: () => updateTech.mutate({ status: "in_progress" }), className: "rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50", children: "Mark in progress" }), _jsx("button", { type: "button", onClick: () => {
                                            const summary = window.prompt("Resolution summary (required):") ?? "";
                                            updateTech.mutate({ status: "resolved", resolution_summary: summary });
                                        }, className: "rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50", children: "Resolve" })] }), _jsx("label", { className: "mt-4 block text-sm font-medium text-gray-700", children: "Internal notes (not visible to user)" }), _jsx("textarea", { rows: 4, defaultValue: t.internal_notes ?? "", id: "internal-notes", className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" }, `notes-${t.id}-${t.updated_at ?? ""}`), _jsx("button", { type: "button", className: "mt-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800", onClick: () => {
                                    const el = document.getElementById("internal-notes");
                                    updateTech.mutate({ internal_notes: el.value });
                                }, children: "Save notes" })] })), isAdmin && (_jsxs("section", { className: "rounded-xl border border-amber-200 bg-amber-50 p-5 md:col-span-2", children: [_jsx("h3", { className: "font-medium text-amber-900", children: "Admin override" }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [["low", "medium", "high"].map((sev) => (_jsxs("button", { type: "button", className: "rounded border border-amber-300 bg-white px-3 py-1.5 text-sm capitalize hover:bg-amber-100", onClick: () => adminPatch.mutate({ severity: sev }), children: ["Severity: ", sev] }, sev))), _jsx("button", { type: "button", className: "rounded border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100", onClick: () => adminPatch.mutate({ status: "open" }), children: "Status \u2192 open" })] })] }))] })] }));
}
