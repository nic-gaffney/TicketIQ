import { cn } from "@/lib/utils";

type BadgeVariant =
  | "severity-low"
  | "severity-medium"
  | "severity-high"
  | "severity-critical"
  | "status-open"
  | "status-assigned"
  | "status-progress"
  | "status-escalated"
  | "status-resolved"
  | "status-archived"
  | "action-classification"
  | "action-override"
  | "action-reassignment"
  | "action-escalation"
  | "action-closure"
  | "action-login"
  | "action-reclassification"
  | "role-user"
  | "role-tech"
  | "role-admin"
  | "neutral";

const variantClass: Record<BadgeVariant, string> = {
  "severity-low": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "severity-medium": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "severity-high": "bg-red-500/15 text-red-300 border-red-500/30",
  "severity-critical": "bg-rose-600/25 text-rose-200 border-rose-500/40",
  "status-open": "bg-zinc-500/20 text-zinc-200 border-zinc-500/35",
  "status-assigned": "bg-sky-500/15 text-sky-200 border-sky-500/35",
  "status-progress": "bg-amber-500/15 text-amber-200 border-amber-500/35",
  "status-escalated": "bg-[var(--escalated)]/20 text-violet-200 border-[var(--escalated)]/40",
  "status-resolved": "bg-emerald-600/20 text-emerald-200 border-emerald-500/35",
  "status-archived": "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",
  "action-classification": "bg-sky-600/25 text-sky-100 border-sky-500/35",
  "action-override": "bg-orange-600/25 text-orange-100 border-orange-500/35",
  "action-reassignment": "bg-violet-600/25 text-violet-100 border-violet-500/35",
  "action-escalation": "bg-red-600/25 text-red-100 border-red-500/35",
  "action-closure": "bg-emerald-600/25 text-emerald-100 border-emerald-500/35",
  "action-login": "bg-zinc-600/30 text-zinc-200 border-zinc-500/35",
  "action-reclassification": "bg-amber-700/30 text-amber-100 border-amber-600/35",
  "role-user": "bg-zinc-600/25 text-zinc-100 border-zinc-500/35",
  "role-tech": "bg-cyan-700/25 text-cyan-100 border-cyan-600/35",
  "role-admin": "bg-fuchsia-700/25 text-fuchsia-100 border-fuchsia-600/35",
  neutral: "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
