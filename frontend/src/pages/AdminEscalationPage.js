import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/client";
export default function AdminEscalationPage() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["escalation-config"],
        queryFn: async () => {
            const { data } = await api.get("admin/escalation");
            return data;
        },
    });
    const [threshold, setThreshold] = useState("");
    const [interval, setInterval] = useState("");
    const [notify, setNotify] = useState("");
    const runCheck = useMutation({
        mutationFn: async () => {
            const { data } = await api.post("admin/escalation/run-check");
            return data.tickets_escalated;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
    });
    const save = useMutation({
        mutationFn: (body) => api.patch("admin/escalation", body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["escalation-config"] }),
    });
    function onSubmit(e) {
        e.preventDefault();
        const body = {};
        if (threshold)
            body.high_unassigned_threshold_minutes = Number(threshold);
        if (interval)
            body.job_interval_seconds = Number(interval);
        if (notify)
            body.notification_target = notify;
        if (Object.keys(body).length)
            save.mutate(body);
    }
    if (isLoading || !data)
        return _jsx("p", { className: "text-gray-600", children: "Loading\u2026" });
    return (_jsxs("div", { className: "max-w-lg space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Escalation rules" }), _jsxs("p", { className: "mt-1 text-sm text-gray-600", children: ["High severity, unassigned tickets past the threshold are auto-escalated (background job every", " ", data.job_interval_seconds, "s in config; dev default may differ in server env)."] })] }), _jsxs("dl", { className: "rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm", children: [_jsxs("div", { className: "flex justify-between py-1", children: [_jsx("dt", { className: "text-gray-500", children: "Threshold (minutes)" }), _jsx("dd", { className: "font-medium", children: data.high_unassigned_threshold_minutes })] }), _jsxs("div", { className: "flex justify-between py-1", children: [_jsx("dt", { className: "text-gray-500", children: "Job interval (seconds)" }), _jsx("dd", { className: "font-medium", children: data.job_interval_seconds })] }), _jsxs("div", { className: "py-1", children: [_jsx("dt", { className: "text-gray-500", children: "Notification target" }), _jsx("dd", { className: "font-mono text-xs", children: data.notification_target })] })] }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "New threshold (minutes)" }), _jsx("input", { type: "number", min: 1, className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm", value: threshold, onChange: (e) => setThreshold(e.target.value), placeholder: String(data.high_unassigned_threshold_minutes) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "New job interval (seconds)" }), _jsx("input", { type: "number", min: 60, className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm", value: interval, onChange: (e) => setInterval(e.target.value), placeholder: String(data.job_interval_seconds) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Notification target" }), _jsx("input", { className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm", value: notify, onChange: (e) => setNotify(e.target.value), placeholder: data.notification_target })] }), _jsx("button", { type: "submit", className: "rounded-lg bg-tmobile px-4 py-2 text-sm font-medium text-white hover:bg-tmobile-dark", children: "Save changes" })] }), _jsx("button", { type: "button", onClick: () => runCheck.mutate(), className: "rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50", children: "Run escalation check now" }), runCheck.isSuccess && (_jsxs("p", { className: "text-sm text-gray-600", children: ["Last run: ", runCheck.data, " ticket(s) escalated."] }))] }));
}
