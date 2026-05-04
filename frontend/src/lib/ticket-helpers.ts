import { differenceInHours } from "date-fns";
import type { Ticket } from "./types";
// import { userById } from "./mock-data";

export function assigneeName(t: Ticket): string {
  if (!t.assignedTo) return "—";
  return t.assignee ?? t.assignedTo;
}

export function avgResolutionHours(tickets: Ticket[]): number {
  const resolved = tickets.filter((t) => t.resolvedAt);
  if (resolved.length === 0) return 0;
  const sum = resolved.reduce((acc, t) => {
    const h = differenceInHours(new Date(t.resolvedAt!), new Date(t.createdAt));
    return acc + Math.max(0, h);
  }, 0);
  return Math.round((sum / resolved.length) * 10) / 10;
}
