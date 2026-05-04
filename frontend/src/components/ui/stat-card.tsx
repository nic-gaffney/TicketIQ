import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  trend,
  className,
  href,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
  /** When set, the whole card navigates (e.g. drill-down to a filtered ticket list). */
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card transition-all duration-200 hover:-translate-y-px hover:border-[var(--brand)]/35 hover:shadow-lift",
        href && "cursor-pointer",
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

  if (href) {
    return (
      <Link
        href={href}
        className="block no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dark-bg)]"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
