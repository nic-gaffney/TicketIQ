import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card transition-all duration-200 hover:-translate-y-px hover:border-[var(--brand)]/35 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="font-display mt-1 text-3xl tracking-wide text-[var(--text-primary)]">
            {value}
          </p>
          {delta ? (
            <p
              className={cn(
                "mt-1 text-xs",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-red-400",
                trend === "flat" && "text-[var(--text-secondary)]",
              )}
            >
              {delta}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-[var(--surface)] p-2 text-[var(--brand)]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
