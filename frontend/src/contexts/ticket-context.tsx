"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { AuditLog, Note, Severity, Ticket, TicketStatus } from "@/lib/types";
import {
  MOCK_AUDIT_LOGS,
  MOCK_TICKETS_SEED,
} from "@/lib/mock-data";

function cloneTickets(seed: Ticket[]): Ticket[] {
  return seed.map((t) => ({
    ...t,
    internalNotes: t.internalNotes?.map((n) => ({ ...n })),
    attachments: t.attachments ? [...t.attachments] : undefined,
  }));
}

export type TicketContextValue = {
  tickets: Ticket[];
  auditLogs: AuditLog[];
  getTicket: (id: string) => Ticket | undefined;
  addTicket: (t: Ticket) => void;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  claimTicket: (id: string, technicianId: string) => void;
  addNote: (ticketId: string, note: Note) => void;
  addAudit: (log: Omit<AuditLog, "logId" | "timestamp"> & { timestamp?: string }) => void;
  runAutoEscalation: () => number;
};

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(() => cloneTickets(MOCK_TICKETS_SEED));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    MOCK_AUDIT_LOGS.map((a) => ({ ...a })),
  );

  const getTicket = useCallback(
    (id: string) => tickets.find((t) => t.ticketId === id),
    [tickets],
  );

  const addTicket = useCallback((t: Ticket) => {
    setTickets((prev) => [t, ...prev]);
  }, []);

  const updateTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === id
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
  }, []);

  const claimTicket = useCallback((id: string, technicianId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === id
          ? {
              ...t,
              assignedTo: technicianId,
              status: (t.status === "open" ? "assigned" : t.status) as TicketStatus,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  }, []);

  const addNote = useCallback((ticketId: string, note: Note) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId
          ? {
              ...t,
              internalNotes: [...(t.internalNotes ?? []), note],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  }, []);

  const addAudit = useCallback(
    (log: Omit<AuditLog, "logId" | "timestamp"> & { timestamp?: string }) => {
      const entry: AuditLog = {
        ...log,
        logId:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `al-${Date.now()}`,
        timestamp: log.timestamp ?? new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);
    },
    [],
  );

  /** Demo: high severity + open + older than 30m → escalated */
  const runAutoEscalation = useCallback(() => {
    const now = Date.now();
    let count = 0;
    setTickets((prev) => {
      const next = prev.map((t) => {
        if (t.severity !== "high" && t.severity !== "critical") return t;
        if (t.status !== "open") return t;
        const created = new Date(t.createdAt).getTime();
        if (now - created < 30 * 60 * 1000) return t;
        count += 1;
        return {
          ...t,
          status: "escalated" as const,
          escalatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      return count ? next : prev;
    });
    return count;
  }, []);

  const value = useMemo(
    () => ({
      tickets,
      auditLogs,
      getTicket,
      addTicket,
      updateTicket,
      claimTicket,
      addNote,
      addAudit,
      runAutoEscalation,
    }),
    [
      tickets,
      auditLogs,
      getTicket,
      addTicket,
      updateTicket,
      claimTicket,
      addNote,
      addAudit,
      runAutoEscalation,
    ],
  );

  return (
    <TicketContext.Provider value={value}>{children}</TicketContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
}

/** Admin override with audit */
export function applySeverityOverride(
  ctx: TicketContextValue,
  ticketId: string,
  actorId: string,
  newSeverity: Severity,
  reason?: string,
) {
  const t = ctx.getTicket(ticketId);
  if (!t) return;
  const old = `severity:${t.severity}`;
  const newVal = `severity:${newSeverity}`;
  ctx.updateTicket(ticketId, { severity: newSeverity });
  ctx.addAudit({
    actorId,
    actorType: "admin",
    actionType: "override",
    ticketId,
    oldValue: old,
    newValue: newVal,
    reason,
  });
}
