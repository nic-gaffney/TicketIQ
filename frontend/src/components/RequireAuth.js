import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50 text-gray-600", children: "Loading\u2026" }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    return _jsx(_Fragment, { children: children });
}
