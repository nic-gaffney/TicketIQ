import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import TicketList from "./TicketList";
const STATUSES = ["", "open", "assigned", "in_progress", "resolved", "escalated"];
const SEVERITIES = ["", "low", "medium", "high"];
export default function QueuePage() {
    const [status_filter, setStatus] = useState("");
    const [severity, setSeverity] = useState("");
    const [archived_only, setArchivedOnly] = useState(false);
    const extraParams = useMemo(() => ({
        ...(status_filter ? { status_filter } : {}),
        ...(severity ? { severity } : {}),
        ...(archived_only ? { archived_only: true } : {}),
    }), [status_filter, severity, archived_only]);
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm", children: [_jsxs("label", { className: "text-sm text-gray-700", children: ["Status", _jsx("select", { className: "ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm", value: status_filter, onChange: (e) => setStatus(e.target.value), children: STATUSES.map((s) => (_jsx("option", { value: s, children: s ? s.replace("_", " ") : "All" }, s || "all"))) })] }), _jsxs("label", { className: "text-sm text-gray-700", children: ["Severity", _jsx("select", { className: "ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm", value: severity, onChange: (e) => setSeverity(e.target.value), children: SEVERITIES.map((s) => (_jsx("option", { value: s, children: s || "All" }, s || "all"))) })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("input", { type: "checkbox", checked: archived_only, onChange: (e) => setArchivedOnly(e.target.checked) }), "Archived only (60d+ resolved)"] })] }), _jsx(TicketList, { title: "Prioritized queue", path: "tickets", extraParams: extraParams })] }));
}
