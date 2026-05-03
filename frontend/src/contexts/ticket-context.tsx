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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

const apiClient = createClient<paths>({
  baseUrl: API_BASE,
  headers: {
    get Authorization() {
      const token = getStoredToken();
      return token ? `Bearer ${token}` : "";
    },
  },
});

function authHeadersInit(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


// ── Context type ─────────────────────────────────────────────────────────────
export type TicketContextValue = {
  tickets:    Ticket[];
  auditLogs:  AuditLog[];
  loading:    boolean;
  error:      string | null;
  refresh:    () => Promise<void>;

  getTicket:       (id: number) => Ticket | undefined;
  createTicket:    (body: {
    description: string;
    affected_system: string;
    category: string;
    region?: string | null;
    attachment?: File | null;
  }) => Promise<Ticket>;
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
    const { data: t, error: te } = await apiClient.GET("/api/v1/tickets");
    if (te) throw new Error(JSON.stringify(te));
    setTickets(t ?? []);
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Failed to load tickets");
  } finally {
    setLoading(false);
  }

  // Audit logs are admin-only — fetch separately and fail silently
  try {
    const { data: a } = await apiClient.GET("/api/v1/audit");
    setAuditLogs(a ?? []);
  } catch {
    // not an admin, ignore
  }
}, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const getTicket = useCallback(
    (id: number) => tickets.find((t) => t.id === id),
    [tickets],
  );

  const createTicket = useCallback(async (body: {
    description: string;
    affected_system: string;
    category: string;
    region?: string | null;
    attachment?: File | null;
  }): Promise<Ticket> => {
    // Use native fetch + FormData so multipart is always correct (FastAPI Form(...) fields).
    const fd = new FormData();
    fd.append("description", body.description);
    fd.append("affected_system", body.affected_system);
    fd.append("category", body.category);
    if (body.region != null && body.region !== "") {
      fd.append("region", body.region);
    }
    if (body.attachment) {
      fd.append("attachment", body.attachment);
    }
    const res = await fetch(`${API_BASE}/api/v1/tickets`, {
      method: "POST",
      headers: authHeadersInit(),
      body: fd,
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = raw || res.statusText;
      try {
        msg = JSON.stringify(JSON.parse(raw));
      } catch {
        /* non-JSON error body */
      }
      throw new Error(msg);
    }
    const data = JSON.parse(raw) as Ticket;
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
