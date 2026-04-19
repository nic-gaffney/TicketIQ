import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-600">Loading…</div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <h1 className="text-4xl font-bold text-tmobile">TicketIQ</h1>
      <p className="mt-3 max-w-md text-center text-gray-600">
        AI-assisted IT helpdesk: submit tickets, automatic severity and urgency, prioritized queues, and escalation
        controls.
      </p>
      <Link
        to="/login"
        className="mt-8 rounded-lg bg-tmobile px-6 py-3 text-sm font-semibold text-white shadow hover:bg-tmobile-dark"
      >
        Sign in
      </Link>
    </main>
  );
}
