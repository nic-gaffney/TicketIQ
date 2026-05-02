"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import createClient from "openapi-fetch";
import type { paths, components } from "@/lib/api.types";

// ── Convenience aliases ──────────────────────────────────────────────────────
export type Ticket             = components["schemas"]["TicketOut"];
export type AuditLog           = components["schemas"]["AuditLogOut"];
export type TicketStatus       = components["schemas"]["TicketStatus"];
export type Severity           = components["schemas"]["Severity"];
export type Urgency            = components["schemas"]["Urgency"];
export type UserPublic         = components["schemas"]["UserPublic"];
export type TicketUpdateTech   = components["schemas"]["TicketUpdateTech"];
export type TicketAdminOverride= components["schemas"]["TicketAdminOverride"];
export type TicketAssign       = components["schemas"]["TicketAssign"];

// ── API client ───────────────────────────────────────────────────────────────
import { getStoredToken } from "@/contexts/auth-context";

const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001",
  headers: {
    get Authorization() {
      const token = getStoredToken();
      return token ? `Bearer ${token}` : "";
    },
  },
});


// ── Context type ─────────────────────────────────────────────────────────────
export type TicketContextValue = {
  tickets:    Ticket[];
  auditLogs:  AuditLog[];
  loading:    boolean;
  error:      string | null;
  refresh:    () => Promise<void>;

  getTicket:       (id: number) => Ticket | undefined;
  createTicket:    (body: { description: string; affected_system: string; category: string; region?: string; attachment?: string }) => Promise<Ticket>;
  updateTicketTech:(id: number, patch: TicketUpdateTech) => Promise<Ticket>;
  claimTicket:     (id: number) => Promise<Ticket>;
  assignTicket:    (id: number, assignee_id: number) => Promise<Ticket>;
  adminOverride:   (id: number, patch: TicketAdminOverride) => Promise<Ticket>;
  fetchAuditLogs:  (ticket_id?: number) => Promise<AuditLog[]>;
  runAutoEscalation: () => Promise<void>;
};

const TicketContext = createContext<TicketContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────
export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets,   setTickets]   = useState<Ticket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: t, error: te }, { data: a, error: ae }] = await Promise.all([
        apiClient.GET("/api/v1/tickets"),
        apiClient.GET("/api/v1/audit"),
      ]);
      if (te) throw new Error(JSON.stringify(te));
      if (ae) throw new Error(JSON.stringify(ae));
      setTickets(t ?? []);
      setAuditLogs(a ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const getTicket = useCallback(
    (id: number) => tickets.find((t) => t.id === id),
    [tickets],
  );

  const createTicket = useCallback(async (
    body: { description: string; affected_system: string; category: string; region?: string; attachment?: string }
  ): Promise<Ticket> => {
    const { data, error } = await apiClient.POST("/api/v1/tickets", {
      // multipart/form-data — openapi-fetch sends FormData automatically
      body: { ...body, attachment: body.attachment ?? null, region: body.region ?? null },
    });
    if (error) throw new Error(JSON.stringify(error));
    setTickets((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateTicketTech = useCallback(async (
    id: number, patch: TicketUpdateTech
  ): Promise<Ticket> => {
    const { data, error } = await apiClient.PATCH(
      "/api/v1/tickets/{ticket_id}/tech",
      { params: { path: { ticket_id: id } }, body: patch },
    );
    if (error) throw new Error(JSON.stringify(error));
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const claimTicket = useCallback(async (id: number): Promise<Ticket> => {
    const { data, error } = await apiClient.POST(
      "/api/v1/tickets/{ticket_id}/claim",
      { params: { path: { ticket_id: id } } },
    );
    if (error) throw new Error(JSON.stringify(error));
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const assignTicket = useCallback(async (
    id: number, assignee_id: number
  ): Promise<Ticket> => {
    const { data, error } = await apiClient.POST(
      "/api/v1/tickets/{ticket_id}/assign",
      { params: { path: { ticket_id: id } }, body: { assignee_id } },
    );
    if (error) throw new Error(JSON.stringify(error));
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const adminOverride = useCallback(async (
    id: number, patch: TicketAdminOverride
  ): Promise<Ticket> => {
    const { data, error } = await apiClient.PATCH(
      "/api/v1/tickets/{ticket_id}/admin",
      { params: { path: { ticket_id: id } }, body: patch },
    );
    if (error) throw new Error(JSON.stringify(error));
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const fetchAuditLogs = useCallback(async (ticket_id?: number): Promise<AuditLog[]> => {
    const { data, error } = await apiClient.GET("/api/v1/audit", {
      params: { query: { ticket_id } },
    });
    if (error) throw new Error(JSON.stringify(error));
    setAuditLogs(data);
    return data;
  }, []);

  const runAutoEscalation = useCallback(async () => {
    const { error } = await apiClient.POST(
      "/api/v1/admin/escalation/run-check",
    );
    if (error) throw new Error(JSON.stringify(error));
    await refresh(); // re-sync tickets after escalation
  }, [refresh]);

  // ── Value ──────────────────────────────────────────────────────────────────

  const value = useMemo<TicketContextValue>(
    () => ({
      tickets, auditLogs, loading, error, refresh,
      getTicket, createTicket, updateTicketTech,
      claimTicket, assignTicket, adminOverride,
      fetchAuditLogs, runAutoEscalation,
    }),
    [
      tickets, auditLogs, loading, error, refresh,
      getTicket, createTicket, updateTicketTech,
      claimTicket, assignTicket, adminOverride,
      fetchAuditLogs, runAutoEscalation,
    ],
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
}

// ── Admin helper (replaces applySeverityOverride) ─────────────────────────────
export async function applySeverityOverride(
  ctx: TicketContextValue,
  ticketId: number,
  newSeverity: Severity,
) {
  await ctx.adminOverride(ticketId, { severity: newSeverity });
}
