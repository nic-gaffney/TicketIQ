"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, type UserPublic } from "@/contexts/auth-context";

function homePathForRole(role: UserPublic["role"]): string {
  if (role === "end_user") return "/dashboard";
  if (role === "it_support") return "/technician/queue";
  return "/admin/overview";
}

const DEMO_QUICK: Record<
  "user" | "technician" | "admin",
  { email: string; password: string }
> = {
  user: { email: "user@ticketiq.demo", password: "password123" },
  technician: { email: "tech@ticketiq.demo", password: "password123" },
  admin: { email: "admin@ticketiq.demo", password: "password123" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const goRole = async (role: "user" | "technician" | "admin") => {
    setError(false);
    const { email: em, password: pw } = DEMO_QUICK[role];
    const u = await login(em, pw);
    if (!u) {
      setError(true);
      return;
    }
    router.replace(homePathForRole(u.role));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const u = await login(email, password);
    setLoading(false);
    if (!u) {
      setError(true);
      return;
    }
    router.replace(homePathForRole(u.role));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--dark-bg)] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(226,0,116,0.25)_0%,_transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] font-display text-3xl text-[var(--brand)] ring-2 ring-[var(--brand)]/30">
            T
          </div>
          <h1 className="font-display text-5xl tracking-[0.18em] text-[var(--text-primary)]">
            TICKETIQ
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            T-Mobile Internal Support System
          </p>
        </div>

        <motion.div
          animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.45 }}
          className={`rounded-2xl border bg-[var(--card-bg)] p-8 shadow-lift ${
            error ? "border-red-500/60" : "border-[var(--border)]"
          }`}
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Username or Email
              </label>
              <input
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--brand)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@t-mobile.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--brand)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-400">Invalid credentials. Try a demo login below.</p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand)] py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand)]/25 transition hover:bg-[var(--brand-light)] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Login via T-Mobile SSO"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="#" className="text-sm text-[var(--brand-light)] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <p className="mb-3 text-center text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Demo quick login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => goRole("user")}
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand)]/50"
              >
                User
              </button>
              <button
                type="button"
                onClick={() => goRole("technician")}
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand)]/50"
              >
                Technician
              </button>
              <button
                type="button"
                onClick={() => goRole("admin")}
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand)]/50"
              >
                Admin
              </button>
            </div>
          </div>
        </motion.div>

        <p className="mt-10 text-center text-xs text-[var(--text-secondary)]">
          T-Mobile Internal Support System · Authorized use only
        </p>
      </motion.div>
    </div>
  );
}
