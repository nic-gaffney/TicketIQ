"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  FileText,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  PlusCircle,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const STORAGE_COLLAPSED = "ticketiq_sidebar_collapsed";

type NavItem = { href: string; label: string; icon: React.ElementType };

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_COLLAPSED);
    const isCollapsed = v === "1";
    if (isCollapsed) setCollapsed(true);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "72px" : "260px",
    );
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "72px" : "260px",
    );
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_COLLAPSED, next ? "1" : "0");
      return next;
    });
  };

  const items = useMemo<NavItem[]>(() => {
    if (!user) return [];
    if (user.role === "end_user") {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard", label: "My Tickets", icon: ClipboardList },
        { href: "/tickets/submit", label: "Submit Ticket", icon: PlusCircle },
      ];
    }
    if (user.role === "technician") {
      return [
        { href: "/technician/queue", label: "Queue", icon: Activity },
        { href: "/technician/escalated", label: "Escalated", icon: AlertTriangle },
        { href: "/technician/resolved", label: "Resolved History", icon: History },
        { href: "/technician/knowledge", label: "Knowledge Base", icon: BookOpen },
      ];
    }
    return [
      { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/ai-config", label: "AI Config", icon: Cpu },
      { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
      { href: "/admin/escalation-rules", label: "Escalation Rules", icon: Shield },
      { href: "/reports", label: "Reports", icon: LineChart },
      { href: "/admin/users", label: "User Management", icon: Users },
    ];
  }, [user]);

  if (!user) return null;

  const roleVariant =
    user.role === "admin"
      ? ("role-admin" as const)
      : user.role === "technician"
        ? ("role-tech" as const)
        : ("role-user" as const);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--card-bg)] transition-[width] duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] font-display text-xl text-[var(--brand)]">
          T
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="font-display text-xl tracking-[0.12em] text-[var(--text-primary)]">
              TICKETIQ
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
              Internal IT
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          className="ml-auto rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              !!pathname &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--surface)] text-white shadow-[inset_3px_0_0_0_var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/70 hover:text-[var(--text-primary)]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar name={user.full_name} role={user.role} size="sm" />
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {user.full_name}
              </p>
              <Badge variant={roleVariant} className="mt-1 text-[10px]">
                {user.role}
              </Badge>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={logout}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]",
            collapsed && "px-2",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? "Logout" : null}
        </button>
      </div>
    </aside>
  );
}
