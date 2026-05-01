"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mock-data";

const STORAGE_KEY = "ticketiq_user_id";

type AuthContextValue = {
  user: User | null;
  login: (emailOrDemoRole: string, password?: string) => boolean;
  logout: () => void;
  loginAsDemo: (role: User["role"]) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function findUser(email: string): User | undefined {
  const q = email.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.email.toLowerCase() === q);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem(STORAGE_KEY);
    if (id && MOCK_USERS.some((u) => u.userId === id)) setUserId(id);
  }, []);

  const user = useMemo(
    () => MOCK_USERS.find((u) => u.userId === userId) ?? null,
    [userId],
  );

  const persist = useCallback((id: string | null) => {
    setUserId(id);
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    (emailOrDemo: string, _password?: string) => {
      const u = findUser(emailOrDemo);
      if (u) {
        persist(u.userId);
        return true;
      }
      return false;
    },
    [persist],
  );

  const loginAsDemo = useCallback(
    (role: User["role"]) => {
      const u = MOCK_USERS.find((x) => x.role === role);
      if (u) persist(u.userId);
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, login, logout, loginAsDemo }),
    [user, login, logout, loginAsDemo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
