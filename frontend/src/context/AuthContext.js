import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("ticketiq_token"));
    const [loading, setLoading] = useState(true);
    const logout = useCallback(() => {
        localStorage.removeItem("ticketiq_token");
        setToken(null);
        setUser(null);
    }, []);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            const t = localStorage.getItem("ticketiq_token");
            if (!t) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await api.get("auth/me");
                if (!cancelled) {
                    setUser(data);
                    setToken(t);
                }
            }
            catch {
                if (!cancelled) {
                    logout();
                }
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [logout]);
    const login = useCallback(async (email, password) => {
        const { data } = await api.post("auth/login", { email, password });
        localStorage.setItem("ticketiq_token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    }, []);
    const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth outside AuthProvider");
    return ctx;
}
