import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
const CATEGORIES = ["Network", "Hardware", "Software", "Security", "Access", "Email", "VPN", "Other"];
export default function SubmitTicket() {
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [affectedSystem, setAffectedSystem] = useState("");
    const [category, setCategory] = useState("Software");
    const [region, setRegion] = useState("");
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
            const form = new FormData();
            form.append("description", description);
            form.append("affected_system", affectedSystem);
            form.append("category", category);
            if (region.trim())
                form.append("region", region.trim());
            if (file)
                form.append("attachment", file);
            const { data } = await api.post("tickets", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            navigate(`/app/tickets/${data.id}`, { replace: true });
        }
        catch {
            setError("Could not submit ticket. Check required fields (min. 10 characters in description).");
        }
        finally {
            setPending(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto max-w-xl", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Submit a ticket" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Describe your issue. TicketIQ analyzes the text to set severity and urgency (MVP uses keyword rules)." }), _jsxs("form", { className: "mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm", onSubmit: onSubmit, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Problem description" }), _jsx("textarea", { required: true, minLength: 10, rows: 5, className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Example: Production VPN is completely down for the Seattle office\u2026" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Affected system or service" }), _jsx("input", { required: true, className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: affectedSystem, onChange: (e) => setAffectedSystem(e.target.value), placeholder: "e.g. GlobalProtect VPN" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Category" }), _jsx("select", { className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: category, onChange: (e) => setCategory(e.target.value), children: CATEGORIES.map((c) => (_jsx("option", { value: c, children: c }, c))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Region (optional)" }), _jsx("input", { className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: region, onChange: (e) => setRegion(e.target.value), placeholder: "e.g. US-West" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Attachment (optional)" }), _jsx("input", { type: "file", className: "mt-1 w-full text-sm", onChange: (e) => setFile(e.target.files?.[0] ?? null) })] }), error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("button", { type: "submit", disabled: pending, className: "w-full rounded-lg bg-tmobile py-2.5 text-sm font-semibold text-white hover:bg-tmobile-dark disabled:opacity-60", children: pending ? "Submitting…" : "Submit ticket" })] })] }));
}
