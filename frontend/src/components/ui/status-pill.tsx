"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";

const labels: Record<TicketStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  escalated: "Escalated",
  resolved: "Resolved",
  archived: "Archived",
};

export function StatusPill({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const pulse = status === "in_progress" || status === "escalated";
  const colors: Record<TicketStatus, string> = {
    open: "bg-zinc-600/40 text-zinc-200 border-zinc-500/40",
    assigned: "bg-sky-600/30 text-sky-100 border-sky-500/40",
    in_progress: "bg-amber-600/35 text-amber-100 border-amber-500/45",
    escalated: "bg-[var(--escalated)]/25 text-violet-100 border-[var(--escalated)]/45",
    resolved: "bg-emerald-600/30 text-emerald-100 border-emerald-500/40",
    archived: "bg-zinc-700/50 text-zinc-400 border-zinc-600/45",
  };

  return (
    <motion.span
      animate={pulse ? { opacity: [1, 0.72, 1] } : undefined}
      transition={{ duration: 2, repeat: pulse ? Infinity : 0, ease: "easeInOut" }}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colors[status],
        className,
      )}
    >
      {labels[status]}
    </motion.span>
  );
}
