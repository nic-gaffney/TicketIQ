import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

export type Role = "end_user" | "it_support" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  region: string | null;
  department: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ticketiq_token"));
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
        const { data } = await api.get<User>("auth/me");
        if (!cancelled) {
          setUser(data);
          setToken(t);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string; user: User }>("auth/login", { email, password });
    localStorage.setItem("ticketiq_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
