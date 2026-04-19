import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading } = useAuth();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const [email, setEmail] = useState("user@ticketiq.demo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    const to = location.state?.from?.pathname ?? "/app";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-tmobile">TicketIQ</h1>
        <p className="mt-1 text-center text-sm text-gray-600">IT Helpdesk — demo login (MVP)</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tmobile focus:outline-none focus:ring-1 focus:ring-tmobile"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-tmobile py-2.5 text-sm font-semibold text-white shadow hover:bg-tmobile-dark disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-gray-500">
          Demo accounts: <span className="font-mono">user@ticketiq.demo</span>,{" "}
          <span className="font-mono">tech@ticketiq.demo</span>, <span className="font-mono">admin@ticketiq.demo</span>{" "}
          — password <span className="font-mono">password123</span>
        </p>
      </div>
    </div>
  );
}
