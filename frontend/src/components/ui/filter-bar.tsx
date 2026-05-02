import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  onClear,
  className,
}: {
  children: React.ReactNode;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3",
        className,
      )}
    >
      {children}
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--brand)]/50 hover:text-[var(--text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </button>
      ) : null}
    </div>
  );
}
