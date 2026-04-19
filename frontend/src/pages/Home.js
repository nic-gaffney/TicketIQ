import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Home() {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-white text-gray-600", children: "Loading\u2026" }));
    }
    if (user) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    return (_jsxs("main", { className: "flex min-h-screen flex-col items-center justify-center bg-white px-4", children: [_jsx("h1", { className: "text-4xl font-bold text-tmobile", children: "TicketIQ" }), _jsx("p", { className: "mt-3 max-w-md text-center text-gray-600", children: "AI-assisted IT helpdesk: submit tickets, automatic severity and urgency, prioritized queues, and escalation controls." }), _jsx(Link, { to: "/login", className: "mt-8 rounded-lg bg-tmobile px-6 py-3 text-sm font-semibold text-white shadow hover:bg-tmobile-dark", children: "Sign in" })] }));
}
