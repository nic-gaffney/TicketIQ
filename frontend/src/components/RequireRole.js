import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function RequireRole({ roles, children }) {
    const { user } = useAuth();
    if (!user || !roles.includes(user.role)) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
