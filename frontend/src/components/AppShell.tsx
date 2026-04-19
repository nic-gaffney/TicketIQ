import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-white text-tmobile shadow-sm" : "text-gray-700 hover:bg-white/60"}`;

export default function AppShell() {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/app" className="text-xl font-bold text-tmobile">
            TicketIQ
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/app/tickets" className={linkClass}>
              {role === "end_user" ? "My tickets" : "All tickets"}
            </NavLink>
            <NavLink to="/app/submit" className={linkClass}>
              Submit
            </NavLink>
            {(role === "it_support" || role === "admin") && (
              <NavLink to="/app/queue" className={linkClass}>
                Queue
              </NavLink>
            )}
            {(role === "it_support" || role === "admin") && (
              <NavLink to="/app/best-fit" className={linkClass}>
                Best fit
              </NavLink>
            )}
            {role === "admin" && (
              <>
                <NavLink to="/app/admin/audit" className={linkClass}>
                  Audit log
                </NavLink>
                <NavLink to="/app/admin/escalation" className={linkClass}>
                  Escalation
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {user?.full_name}
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{user?.role}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
