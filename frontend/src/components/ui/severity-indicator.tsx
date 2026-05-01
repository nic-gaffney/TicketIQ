import {
  AlertTriangle,
  Flame,
  Leaf,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const meta: Record<
  Severity,
  { label: string; Icon: LucideIcon; className: string }
> = {
  low: {
    label: "Low",
    Icon: Leaf,
    className: "border-l-[var(--severity-low)] text-emerald-300",
  },
  medium: {
    label: "Medium",
    Icon: AlertTriangle,
    className: "border-l-[var(--severity-medium)] text-amber-300",
  },
  high: {
    label: "High",
    Icon: ShieldAlert,
    className: "border-l-[var(--severity-high)] text-red-300",
  },
  critical: {
    label: "Critical",
    Icon: Flame,
    className: "border-l-[var(--severity-critical)] text-rose-300",
  },
};

export function SeverityIndicator({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const m = meta[severity];
  const Icon = m.Icon;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--border)] border-l-4 bg-[var(--surface)]/60 px-3 py-2",
        m.className,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      <span className="text-sm font-medium">{m.label}</span>
    </div>
  );
}
