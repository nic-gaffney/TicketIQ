// lib/types.ts
// Single source of truth — all types derived from the OpenAPI schema.
// Aliases preserve the old names so existing imports keep working.

import type { components } from "@/lib/api.types";
import { mapApiCategoryToIssueCategory } from "@/lib/category-mapping";

// ── Enums ─────────────────────────────────────────────────────────────────────

export type Role         = components["schemas"]["UserRole"];
// API uses "low"|"medium"|"high" — "critical" is frontend-only, kept for UI use
export type Severity     = components["schemas"]["Severity"] | "critical";
export type Urgency      = components["schemas"]["Urgency"];
export type TicketStatus = components["schemas"]["TicketStatus"];

// "archived" and "in_progress" — verify these exist in your backend enum,
// the API schema shows: "open"|"assigned"|"in_progress"|"resolved"|"escalated"
// If your backend doesn't return "archived", remove it here.
export type IssueCategory =
  | "network"
  | "software"
  | "hardware"
  | "account"
  | "security"
  | "other";

// ── Core models ───────────────────────────────────────────────────────────────

// User — mapped from UserPublic
export type User = {
  userId:          string;                          // ← api: id (number, cast to string)
  name:            string;                          // ← api: full_name
  email:           string;
  role:            Role;
  department?:     string;
  region?:         string;
  specializations?: IssueCategory[];               // frontend-only, not in API
};

// Ticket — mapped from TicketOut
export type Ticket = {
  ticketId:       string;                           // ← api: id (number, cast to string)
  title:          string;                           // frontend-only (derived from description)
  submittedBy:    string;                           // ← api: submitted_by_id (cast to string)
  description:    string;
  affectedSystem: string;                           // ← api: affected_system
  category:       IssueCategory;                   // ← api: category (string)
  severity:       Severity;
  urgency:        Urgency;
  priorityScore:  number;                           // ← api: priority_score
  status:         TicketStatus;
  assignedTo?:    string;                           // ← api: assigned_to_id (cast to string)
  createdAt:      string;                           // ← api: created_at
  updatedAt:      string;                           // ← api: updated_at
  escalatedAt?:   string;                           // ← api: escalated_at
  resolvedAt?:    string;                           // ← api: resolved_at
  attachments?:   string[];                         // ← api: attachment_path (single → wrap in array)
  internalNotes?: Note[];                           // ← api: internal_notes (string → parsed)
  aiConfidence:   number;                           // frontend-only, not in API
  slaDeadline:    string;                           // frontend-only, not in API
  region:         string;
};

// Note — no direct API equivalent, internal_notes is a plain string on TicketOut
export type Note = {
  noteId:        string;
  authorId:      string;
  content:       string;
  createdAt:     string;
  visibleToUser: boolean;
};

// AuditLog — mapped from AuditLogOut
export type AuditLog = {
  logId:      string;                               // ← api: id (cast to string)
  actorId:    string;                               // ← api: actor_user_id (cast to string)
  actorType:  "system" | "admin" | "technician";   // ← api: actor_label (mapped)
  actionType: "classification" | "override" | "reassignment" | "escalation" | "closure" | "login" | "reclassification";
  ticketId?:  string;                               // ← api: ticket_id (cast to string)
  oldValue?:  string;
  newValue?:  string;
  reason?:    string;
  timestamp:  string;                               // ← api: created_at
};

// EscalationRule — mapped from EscalationConfigOut
export type EscalationRule = {
  ruleId:                  string;                  // ← api: id (cast to string)
  severityThreshold:       Severity;               // frontend-only default
  timeThresholdMinutes:    number;                  // ← api: high_unassigned_threshold_minutes
  checkIntervalMinutes:    number;                  // ← api: job_interval_seconds / 60
  notificationTarget:      string;                  // ← api: notification_target
  isActive:                boolean;                // frontend-only default
  version:                 number;                 // frontend-only
  updatedAt:               string;                  // ← api: updated_at
  updatedBy:               string;                 // frontend-only
};

// These two are frontend-only — API returns Record<string, never> for reports
export type WeeklyReport = {
  weekOf:                  string;
  totalTickets:            number;
  resolvedTickets:         number;
  avgResolutionTimeHours:  number;
  escalationCount:         number;
  slaBreachRate:           number;
  topCategories:           { category: string; count: number }[];
  teamBreakdown:           { team: string; resolved: number; avgTime: number }[];
};

export type EscalationRuleVersion = {
  version:   number;
  timestamp: string;
  changedBy: string;
  changes:   string;
};

// ── API type re-exports (use these when talking directly to the API) ───────────
export type { components } from "@/lib/api.types";
export type TicketOut          = components["schemas"]["TicketOut"];
export type UserPublic         = components["schemas"]["UserPublic"];
export type AuditLogOut        = components["schemas"]["AuditLogOut"];
export type EscalationConfigOut= components["schemas"]["EscalationConfigOut"];
export type TicketUpdateTech   = components["schemas"]["TicketUpdateTech"];
export type TicketAdminOverride= components["schemas"]["TicketAdminOverride"];

// ── Mapper helpers ─────────────────────────────────────────────────────────────
// Use these to convert API responses into the legacy shape your UI expects.

export function ticketFromApi(t: TicketOut): Ticket {
  return {
    ticketId:       String(t.id),
    title:          t.description.slice(0, 60),
    submittedBy:    String(t.submitted_by_id),
    description:    t.description,
    affectedSystem: t.affected_system,
    category:       mapApiCategoryToIssueCategory(t.category) as IssueCategory,
    severity:       t.severity,
    urgency:        t.urgency,
    priorityScore:  t.priority_score,
    status:         t.status,
    assignedTo:     t.assigned_to_id != null ? String(t.assigned_to_id) : undefined,
    createdAt:      t.created_at,
    updatedAt:      t.updated_at,
    escalatedAt:    t.escalated_at ?? undefined,
    resolvedAt:     t.resolved_at ?? undefined,
    attachments:    t.attachment_path ? [t.attachment_path] : undefined,
    internalNotes:  t.internal_notes
      ? [{ noteId: "1", authorId: "", content: t.internal_notes, createdAt: t.updated_at, visibleToUser: false }]
      : undefined,
    aiConfidence:   0,       // not in API, default until you add it
    slaDeadline:    t.created_at, // not in API, default until you add it
    region:         t.region ?? "",
  };
}

export function userFromApi(u: UserPublic): User {
  return {
    userId:     String(u.id),
    name:       u.full_name,
    email:      u.email,
    role:       u.role,
    department: u.department,
    region:     u.region ?? undefined,
  };
}

export function auditFromApi(a: AuditLogOut): AuditLog {
  return {
    logId:     String(a.id),
    actorId:   String(a.actor_user_id ?? "system"),
    actorType: "system",  // map from actor_label if your backend sends "admin"|"technician"
    actionType: "classification",  // map from a.action when you know the enum values
    ticketId:  String(a.ticket_id),
    timestamp: a.created_at,
  };
}
