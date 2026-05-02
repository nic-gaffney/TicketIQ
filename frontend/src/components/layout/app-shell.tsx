"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--dark-bg)]">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width,260px)] max-w-[85vw] transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Sidebar />
      </div>
      <div
        className="min-h-screen transition-[margin] duration-300 lg:ml-[var(--sidebar-width,260px)]"
      >
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <div className="page-enter px-4 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
