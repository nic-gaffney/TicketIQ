"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  shortcutHint = "⌘K",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  shortcutHint?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2",
        "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand)]",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value ? (
        <button
          type="button"
          className="rounded p-0.5 text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]"
          onClick={() => onChange("")}
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] sm:inline">
          {shortcutHint}
        </kbd>
      )}
    </div>
  );
}
