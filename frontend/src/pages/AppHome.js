import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
/** Default landing inside the app shell. */
export default function AppHome() {
    const { user } = useAuth();
    if (user?.role === "end_user") {
        return _jsx(Navigate, { to: "/app/tickets", replace: true });
    }
    return _jsx(Navigate, { to: "/app/queue", replace: true });
}
