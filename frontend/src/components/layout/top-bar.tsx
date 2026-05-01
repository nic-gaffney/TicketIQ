"use client";

import { Bell, Menu } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { useTickets } from "@/contexts/ticket-context";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { tickets } = useTickets();
  const [q, setQ] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [debouncedQ, setDebouncedQ] = useState("");

  const dSet = useMemo(
    () =>
      debounce((v: string) => {
        setDebouncedQ(v);
      }, 300),
    [],
  );

  useEffect(() => {
    dSet(q);
  }, [q, dSet]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hitCount = useMemo(() => {
    if (!debouncedQ.trim()) return 0;
    const s = debouncedQ.toLowerCase();
    return tickets.filter(
      (t) =>
        t.ticketId.toLowerCase().includes(s) ||
        t.title.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s),
    ).length;
  }, [debouncedQ, tickets]);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--dark-bg)]/90 px-4 py-3 backdrop-blur-md lg:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)] lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-[200px] flex-1">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search tickets by ID, title, description…"
        />
        {debouncedQ.trim() ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {hitCount} match{hitCount === 1 ? "" : "es"} in workspace
          </p>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right text-xs text-[var(--text-secondary)] sm:block">
          <div className="font-mono text-[var(--text-primary)]">{format(now, "HH:mm:ss")}</div>
          <div>{format(now, "EEE, MMM d, yyyy")}</div>
        </div>
        <button
          type="button"
          className="relative rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--brand)]" />
        </button>
      </div>
    </header>
  );
}
