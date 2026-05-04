"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTickets } from "@/contexts/ticket-context";
import { useToast } from "@/contexts/toast-context";
import { userById } from "@/lib/mock-data";
import { isAdmin, isItSupport } from "@/lib/roles";
import { AIClassificationBlock } from "@/components/tickets/ai-classification-block";
import { AttachmentPreview } from "@/components/tickets/attachment-preview";
import { InternalNoteThread } from "@/components/tickets/internal-note-thread";
import { TicketStatusTimeline } from "@/components/tickets/ticket-status-timeline";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { SLATimer } from "@/components/ui/sla-timer";
import { StatusPill } from "@/components/ui/status-pill";
import { assigneeName } from "@/lib/ticket-helpers";
import { ticketFromApi, type Severity } from "@/lib/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = typeof rawId === "string" ? decodeURIComponent(rawId) : "";
  const ticketNumericId = id !== "" ? Number.parseInt(id, 10) : NaN;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const ticketCtx = useTickets();
  const {
    tickets,
    getTicket,
    updateTicketTech,
    claimTicket,
    assignTicket,
    adminOverride,
  } = ticketCtx;

  const apiTicket =
    Number.isFinite(ticketNumericId) ? getTicket(ticketNumericId) : undefined;
  const ticket = apiTicket ? ticketFromApi(apiTicket) : undefined;
  const [noteBody, setNoteBody] = useState("");
  const [severityDraft, setSeverityDraft] = useState<Severity | "">("");
  const [overrideModal, setOverrideModal] = useState(false);
  const [confirmEscalate, setConfirmEscalate] = useState(false);
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [resolveModal, setResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");

  const submitter = ticket ? userById(ticket.submittedBy) : undefined;

  const queueRank = useMemo(() => {
    if (!ticket) return null;
    const sorted = [...tickets]
      .map(ticketFromApi)
      .sort((a, b) => b.priorityScore - a.priorityScore);
    const idx = sorted.findIndex((t) => t.ticketId === ticket.ticketId);
    return idx >= 0 ? idx + 1 : null;
  }, [tickets, ticket]);

  const assigneeOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tickets) {
      const a = t.assignee;
      if (a && (a.role === "it_support" || a.role === "admin")) {
        m.set(a.id, a.full_name);
      }
    }
    if (user && (isItSupport(user.role) || isAdmin(user.role))) {
      m.set(user.id, `${user.full_name} (you)`);
    }
    return Array.from(m.entries()).map(([assigneeId, name]) => ({ id: assigneeId, name }));
  }, [tickets, user]);

  if (!id || !user || !ticket || !apiTicket) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-10 text-center">
        <p className="text-[var(--text-secondary)]">
          Ticket not found or you do not have access.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-[var(--brand)]">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const canTechNotes = isItSupport(user.role) || isAdmin(user.role);
  const canAssign = isItSupport(user.role) || isAdmin(user.role);
  const adminOnly = isAdmin(user.role);
  /** Resolve / escalate / claim — IT staff only; end users are read-only for workflow actions */
  const canManageTicket = isItSupport(user.role) || isAdmin(user.role);

  const postNote = async () => {
    if (!noteBody.trim()) return;
    const stamp = new Date().toISOString();
    const line = `[${stamp}] ${user.full_name}: ${noteBody.trim()}`;
    const existing = (apiTicket.internal_notes ?? "").trim();
    const next = existing ? `${existing}\n\n${line}` : line;
    try {
      await updateTicketTech(ticketNumericId, { internal_notes: next });
      setNoteBody("");
      toast({ title: "Note posted", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Failed to post note",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const onClaim = async () => {
    try {
      await claimTicket(ticketNumericId);
      toast({ title: "Ticket claimed", description: ticket.ticketId, kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Claim failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const confirmResolve = async () => {
    const summary = resolutionSummary.trim();
    if (!summary) {
      toast({ title: "Resolution summary required", kind: "warning" });
      return;
    }
    try {
      await updateTicketTech(ticketNumericId, {
        status: "resolved",
        resolution_summary: summary,
      });
      setResolveModal(false);
      setResolutionSummary("");
      toast({ title: "Ticket resolved", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Resolve failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const onEscalate = async () => {
    try {
      await updateTicketTech(ticketNumericId, { status: "escalated" });
      setConfirmEscalate(false);
      toast({ title: "Escalated", kind: "warning" });
    } catch (e: unknown) {
      toast({
        title: "Escalation failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const onMarkInProgress = async () => {
    try {
      await updateTicketTech(ticketNumericId, { status: "in_progress" });
      toast({ title: "Marked in progress", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const onReassign = async () => {
    if (!assigneeDraft) return;
    const aid = Number.parseInt(assigneeDraft, 10);
    if (!Number.isFinite(aid)) return;
    try {
      await assignTicket(ticketNumericId, aid);
      setAssigneeDraft("");
      toast({ title: "Assignment updated", kind: "success" });
    } catch (e: unknown) {
      toast({
        title: "Reassign failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  const applyOverride = async () => {
    if (!severityDraft || severityDraft === "critical") {
      toast({ title: "Pick low, medium, or high", kind: "warning" });
      return;
    }
    try {
      await adminOverride(ticketNumericId, {
        severity: severityDraft as "low" | "medium" | "high",
      });
      toast({ title: "Severity updated", kind: "success" });
      setOverrideModal(false);
      setSeverityDraft("");
    } catch (e: unknown) {
      toast({
        title: "Override failed",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="font-mono text-3xl text-[var(--brand)]">{ticket.ticketId}</h1>
              <StatusPill status={ticket.status} />
              <Badge
                variant={
                  ticket.severity === "low"
                    ? "severity-low"
                    : ticket.severity === "medium"
                      ? "severity-medium"
                      : ticket.severity === "high"
                        ? "severity-high"
                        : "severity-critical"
                }
              >
                {ticket.severity}
              </Badge>
              <Badge variant="neutral">{ticket.urgency} urgency</Badge>
            </div>
            <div className="mt-4 max-w-md">
              <SLATimer deadlineIso={ticket.slaDeadline} />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
              {ticket.title}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-[var(--text-secondary)]">
              {ticket.description}
            </p>

            {ticket.attachments?.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Attachments
                </h3>
                <div className="mt-2 space-y-2">
                  {ticket.attachments.map((a) => (
                    <AttachmentPreview key={a} name={a} sizeBytes={128 * 1024} />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <AIClassificationBlock
                severity={ticket.severity}
                urgency={ticket.urgency}
                priorityScore={ticket.priorityScore}
                confidence={ticket.aiConfidence}
              />
            </div>

            <dl className="mt-6 grid gap-3 border-t border-[var(--border)] pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--text-secondary)]">Submitted by</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {apiTicket.submitter?.full_name ?? submitter?.name ?? ticket.submittedBy}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Assigned to</dt>
                <dd className="text-[var(--text-primary)]">
                  {apiTicket.assignee?.full_name ?? assigneeName(ticket)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Category</dt>
                <dd className="capitalize text-[var(--text-primary)]">{ticket.category}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Region</dt>
                <dd className="text-[var(--text-primary)]">{ticket.region}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Created</dt>
                <dd className="font-mono text-xs text-[var(--text-primary)]">
                  {format(new Date(ticket.createdAt), "PPpp")}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Updated</dt>
                <dd className="font-mono text-xs text-[var(--text-primary)]">
                  {format(new Date(ticket.updatedAt), "PPpp")}
                </dd>
              </div>
            </dl>
          </div>

          {canTechNotes ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Internal notes
              </h3>
              <div className="mt-4">
                <InternalNoteThread notes={ticket.internalNotes ?? []} />
              </div>
              <div className="mt-4 flex gap-2">
                <textarea
                  className="min-h-[88px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="Add internal note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <button
                  type="button"
                  onClick={postNote}
                  className="self-end rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
                >
                  Post
                </button>
              </div>
            </div>
          ) : null}

          <TicketStatusTimeline
            status={ticket.status}
            createdAt={ticket.createdAt}
            updatedAt={ticket.updatedAt}
            escalatedAt={ticket.escalatedAt}
            resolvedAt={ticket.resolvedAt}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <p className="text-xs uppercase text-[var(--text-secondary)]">Queue position</p>
            <p className="font-display mt-1 text-4xl text-[var(--text-primary)]">
              #{queueRank ?? "—"}
            </p>
          </div>

          {adminOnly ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Severity override
              </p>
              <select
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                value={severityDraft}
                onChange={(e) => setSeverityDraft(e.target.value as Severity)}
              >
                <option value="">Select…</option>
                {(["low", "medium", "high"] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-[var(--brand)] py-2 text-sm text-[var(--brand)] hover:bg-[var(--surface)]"
                onClick={() => setOverrideModal(true)}
              >
                Override severity
              </button>
            </div>
          ) : null}

          {canAssign ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Assignment</p>
              <select
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                value={assigneeDraft || ticket.assignedTo || ""}
                onChange={(e) => setAssigneeDraft(e.target.value)}
              >
                {assigneeOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onReassign}
                className="mt-3 w-full rounded-lg bg-[var(--surface)] py-2 text-sm text-[var(--text-primary)] hover:border hover:border-[var(--brand)]/40"
              >
                Reassign
              </button>
            </div>
          ) : null}

          {canManageTicket ? (
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                IT actions
              </p>
              {(isItSupport(user.role) || isAdmin(user.role)) &&
              ticket.assignedTo !== String(user.id) ? (
                <button
                  type="button"
                  onClick={() => void onClaim()}
                  className="w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white"
                >
                  Claim ticket
                </button>
              ) : null}
              {ticket.status !== "in_progress" && ticket.status !== "resolved" ? (
                <button
                  type="button"
                  onClick={() => void onMarkInProgress()}
                  className="w-full rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  Mark in progress
                </button>
              ) : null}
              {ticket.status !== "resolved" ? (
                <button
                  type="button"
                  onClick={() => setResolveModal(true)}
                  className="w-full rounded-lg bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  ✓ Resolve ticket…
                </button>
              ) : null}
              {ticket.status !== "escalated" && ticket.status !== "resolved" ? (
                <button
                  type="button"
                  onClick={() => setConfirmEscalate(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/50 py-2 text-sm font-medium text-red-100 hover:bg-red-800/60"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalate
                </button>
              ) : null}
              {canTechNotes ? (
                <button
                  type="button"
                  onClick={() => document.querySelector("textarea")?.focus()}
                  className="w-full rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  Add internal note
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 text-sm text-[var(--text-secondary)]">
              Workflow updates (resolve, escalate, assignment) are handled by IT. You&apos;ll get
              email updates when status changes.
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmEscalate}
        onClose={() => setConfirmEscalate(false)}
        onConfirm={() => void onEscalate()}
        title="Escalate this ticket?"
        description="Escalation notifies duty managers and adjusts SLA handling."
        confirmLabel="Escalate"
        danger
      />

      <Modal open={resolveModal} onClose={() => setResolveModal(false)} title="Resolve ticket">
        <p className="mb-2 text-sm text-[var(--text-secondary)]">
          The API requires a short resolution summary before closing the ticket.
        </p>
        <textarea
          className="mb-4 min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
          placeholder="What was done / outcome…"
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => {
              setResolveModal(false);
              setResolutionSummary("");
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            onClick={() => void confirmResolve()}
          >
            Resolve
          </button>
        </div>
      </Modal>

      <Modal open={overrideModal} onClose={() => setOverrideModal(false)} title="Confirm override">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Apply severity change and write an audit record?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            onClick={() => setOverrideModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm text-white"
            onClick={() => void applyOverride()}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}
