"use client";

import { motion } from "framer-motion";
import type { Severity, Urgency } from "@/lib/types";
import { PriorityScore } from "@/components/ui/priority-score";
import { SeverityIndicator } from "@/components/ui/severity-indicator";
import { Badge } from "@/components/ui/badge";

const urgencyLabel: Record<Urgency, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function AIClassificationBlock({
  severity,
  urgency,
  priorityScore,
  confidence,
}: {
  severity: Severity;
  urgency: Urgency;
  priorityScore: number;
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  const arc = 2 * Math.PI * 36;
  const dash = arc * confidence;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI classification</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <SeverityIndicator severity={severity} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Urgency</span>
            <Badge variant="neutral">{urgencyLabel[urgency]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)]">Priority score</span>
            <PriorityScore score={priorityScore} size={64} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="relative h-28 w-28">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="rgba(42,42,74,0.9)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="var(--brand)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${dash} ${arc}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">{pct}%</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Confidence
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
