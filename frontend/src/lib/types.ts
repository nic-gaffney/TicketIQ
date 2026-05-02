export type Role = "user" | "technician" | "admin";
export type Severity = "low" | "medium" | "high" | "critical";
export type Urgency = "low" | "medium" | "high";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "archived";
export type IssueCategory =
  | "network"
  | "software"
  | "hardware"
  | "account"
  | "security"
  | "other";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  region?: string;
  specializations?: IssueCategory[];
}

export interface Note {
  noteId: string;
  authorId: string;
  content: string;
  createdAt: string;
  visibleToUser: boolean;
}

export interface Ticket {
  ticketId: string;
  /** Short summary shown in tables */
  title: string;
  submittedBy: string;
  description: string;
  affectedSystem: string;
  category: IssueCategory;
  severity: Severity;
  urgency: Urgency;
  priorityScore: number;
  status: TicketStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  escalatedAt?: string;
  resolvedAt?: string;
  attachments?: string[];
  internalNotes?: Note[];
  aiConfidence: number;
  slaDeadline: string;
  region: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorType: "system" | "admin" | "technician";
  actionType:
    | "classification"
    | "override"
    | "reassignment"
    | "escalation"
    | "closure"
    | "login"
    | "reclassification";
  ticketId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface EscalationRule {
  ruleId: string;
  severityThreshold: Severity;
  timeThresholdMinutes: number;
  checkIntervalMinutes: number;
  notificationTarget: string;
  isActive: boolean;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface WeeklyReport {
  weekOf: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
  escalationCount: number;
  slaBreachRate: number;
  topCategories: { category: string; count: number }[];
  teamBreakdown: { team: string; resolved: number; avgTime: number }[];
}

export interface EscalationRuleVersion {
  version: number;
  timestamp: string;
  changedBy: string;
  changes: string;
}
