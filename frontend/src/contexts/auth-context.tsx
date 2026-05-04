"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import createClient from "openapi-fetch";
import type { paths, components } from "@/lib/api.types";

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserPublic = components["schemas"]["UserPublic"];
export type UserRole   = components["schemas"]["UserRole"];

// ── API client ────────────────────────────────────────────────────────────────
const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001",
});

const TOKEN_KEY = "ticketiq_user_id";

// ── Context type ──────────────────────────────────────────────────────────────
type AuthContextValue = {
  user:    UserPublic | null;
  loading: boolean;
  error:   string | null;
  /** Returns the signed-in user on success, or `null` on failure. */
  login:   (email: string, password: string) => Promise<UserPublic | null>;
  logout:  () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // On mount — if a token exists already, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    apiClient
      .GET("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data, error }) => {
        if (error || !data) {
          localStorage.removeItem(TOKEN_KEY);
        } else {
          setUser(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserPublic | null> => {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await apiClient.POST("/api/v1/auth/login", {
        body: { email, password },
      });

      if (error || !data) {
        setError("Invalid email or password");
        return null;
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser(data.user);
      return data.user;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, logout }),
    [user, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ── Token helper (import this in your TicketContext api client) ───────────────
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
