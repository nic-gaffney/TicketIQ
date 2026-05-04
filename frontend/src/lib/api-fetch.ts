import { getStoredToken } from "@/contexts/auth-context";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

/** Authenticated JSON fetch for paths under `/api/v1`. */
export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
}

export type EscalationConfigDTO = {
  id: number;
  high_unassigned_threshold_minutes: number;
  job_interval_seconds: number;
  notification_target: string;
  updated_at: string;
};

export type EscalationConfigPatch = {
  high_unassigned_threshold_minutes?: number;
  job_interval_seconds?: number;
  notification_target?: string | null;
};

export type WeeklyReportDTO = {
  period_days: number;
  resolved_by_department: Record<string, number>;
  currently_escalated_count: number;
  generated_at: string;
};

export type WeeklyEscalationsDTO = {
  auto_escalations_last_7_days: number;
  since: string;
};

export type RunEscalationCheckDTO = {
  tickets_escalated: number;
};
