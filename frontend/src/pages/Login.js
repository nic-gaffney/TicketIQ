import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Login() {
    const { login, user, loading } = useAuth();
    const location = useLocation();
    const [email, setEmail] = useState("user@ticketiq.demo");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    if (!loading && user) {
        const to = location.state?.from?.pathname ?? "/app";
        return _jsx(Navigate, { to: to, replace: true });
    }
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
            await login(email, password);
        }
        catch {
            setError("Invalid email or password.");
        }
        finally {
            setPending(false);
        }
    }
    return (_jsx("div", { className: "flex min-h-screen flex-col justify-center bg-white px-4", children: _jsxs("div", { className: "mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm", children: [_jsx("h1", { className: "text-center text-2xl font-bold text-tmobile", children: "TicketIQ" }), _jsx("p", { className: "mt-1 text-center text-sm text-gray-600", children: "IT Helpdesk \u2014 demo login (MVP)" }), _jsxs("form", { className: "mt-8 space-y-4", onSubmit: onSubmit, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx("input", { className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "username" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsx("input", { type: "password", className: "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password" })] }), error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("button", { type: "submit", disabled: pending, className: "w-full rounded-lg bg-tmobile py-2.5 text-sm font-semibold text-white shadow hover:bg-tmobile-dark disabled:opacity-60", children: pending ? "Signing in…" : "Sign in" })] }), _jsxs("p", { className: "mt-6 text-xs text-gray-500", children: ["Demo accounts: ", _jsx("span", { className: "font-mono", children: "user@ticketiq.demo" }), ",", " ", _jsx("span", { className: "font-mono", children: "tech@ticketiq.demo" }), ", ", _jsx("span", { className: "font-mono", children: "admin@ticketiq.demo" }), " ", "\u2014 password ", _jsx("span", { className: "font-mono", children: "password123" })] })] }) }));
}
