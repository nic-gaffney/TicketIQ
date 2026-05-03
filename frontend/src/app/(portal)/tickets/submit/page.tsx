"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Cpu,
  KeyRound,
  Monitor,
  Shield,
  Wifi,
  HelpCircle,
} from "lucide-react";
import { useTickets } from "@/contexts/ticket-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { IssueCategory, Severity, Urgency } from "@/lib/types";
import { ISSUE_CATEGORY_OPTIONS, issueCategoryToApiCategory } from "@/lib/category-mapping";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<IssueCategory, React.ElementType> = {
  network: Wifi,
  software: Monitor,
  hardware: Cpu,
  account: KeyRound,
  security: Shield,
  other: HelpCircle,
};

function formatCreateError(err: unknown): string {
  if (!(err instanceof Error)) return "Could not create ticket. Try again.";
  try {
    const parsed = JSON.parse(err.message) as { detail?: unknown };
    const d = parsed?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      const msg = d.map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: string }).msg) : "")).filter(Boolean).join("; ");
      if (msg) return msg;
    }
  } catch {
    /* raw message */
  }
  if (err.message.length < 400) return err.message;
  return "Could not create ticket. Check category and fields, then try again.";
}

export default function SubmitTicketPage() {
  const { user } = useAuth();
  const { createTicket } = useTickets();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>("network");
  const [userPriority, setUserPriority] = useState<"" | "low" | "medium" | "high">("");
  const [description, setDescription] = useState("");
  const [affected, setAffected] = useState("");
  const [region, setRegion] = useState(user?.region ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<"form" | "analyze" | "done">("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ticketId: string;
    severity: Severity;
    urgency: Urgency;
    score: number;
  } | null>(null);

  const descLen = description.trim().length;
  const descOk = descLen >= 50;
  const needChars = Math.max(0, 50 - descLen);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files).slice(0, 6);
    setFiles((prev) => [...prev, ...list].slice(0, 6));
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked?.length) return;
    setFiles((prev) => [...prev, ...Array.from(picked)].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !descOk) return;
    setSubmitError(null);
    setPhase("analyze");
    const affRaw = affected.trim();
    const affected_system =
      affRaw.length >= 2 ? affRaw.slice(0, 255) : "General IT systems";
    const descBody = description.trim();
    let fullDescription = title.trim() ? `${title.trim()}\n\n${descBody}` : descBody;
    if (userPriority) {
      fullDescription += `\n\n[Reporter priority note: ${userPriority}]`;
    }
    const apiCategory = issueCategoryToApiCategory(category);
    const regionVal = (region.trim() || user.region || "").trim() || null;
    const attachment = files[0] ?? null;

    try {
      const created = await createTicket({
        description: fullDescription,
        affected_system,
        category: apiCategory,
        region: regionVal,
        attachment,
      });
      setResult({
        ticketId: String(created.id),
        severity: created.severity,
        urgency: created.urgency,
        score: created.priority_score,
      });
      setPhase("done");
      setFiles([]);
      toast({ title: "Ticket created", description: `Ticket #${created.id}`, kind: "success" });
    } catch (err) {
      setPhase("form");
      const msg = formatCreateError(err);
      setSubmitError(msg);
      toast({ title: "Submit failed", description: msg, kind: "error" });
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-[var(--text-primary)]">
          Submit a ticket
        </h1>
        <p className="text-[var(--text-secondary)]">
          Creates a real ticket in TicketIQ (AI classification runs on the server).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6"
        >
          {phase === "analyze" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <LoadingSpinner className="h-12 w-12" />
              <p className="text-[var(--text-secondary)]">Submitting ticket…</p>
            </div>
          ) : phase === "done" && result ? (
            <div className="space-y-6 py-6 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
              >
                ✓
              </motion.div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Ticket created</p>
                <p className="font-mono text-2xl text-[var(--brand)]">{result.ticketId}</p>
              </div>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap justify-center gap-2"
                >
                  <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs uppercase text-red-200">
                    {result.severity}
                  </span>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs uppercase text-amber-100">
                    {result.urgency} urgency
                  </span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs text-emerald-100">
                    score {result.score}
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/tickets/${result.ticketId}`}
                  className="inline-flex rounded-lg bg-[var(--brand)] px-6 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-light)]"
                >
                  Track your ticket
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("form");
                    setResult(null);
                    setSubmitError(null);
                  }}
                  className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : (
            <>
              {submitError ? (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {submitError}
                </p>
              ) : null}

              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">
                  Ticket title
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:outline focus:outline-2 focus:outline-[var(--brand)]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary (optional — prepended to description)"
                />
              </div>

              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">
                  Issue category
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ISSUE_CATEGORY_OPTIONS.map((c) => {
                    const Icon = CATEGORY_ICONS[c.value];
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                          active
                            ? "border-[var(--brand)] bg-[var(--surface)] text-white"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40",
                        )}
                      >
                        <Icon className="h-4 w-4 text-[var(--brand)]" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">
                  Priority hint (optional)
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
                  value={userPriority}
                  onChange={(e) => setUserPriority(e.target.value as typeof userPriority)}
                >
                  <option value="">None — let server classify from description</option>
                  <option value="low">Low — non-blocking</option>
                  <option value="medium">Medium — standard</option>
                  <option value="high">High — revenue / security risk</option>
                </select>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  Appended to the description text so the server classifier can weigh it.
                </p>
              </div>

              <div>
                <label className="text-xs uppercase text-[var(--text-secondary)]">
                  Description (min 50 characters)
                </label>
                <textarea
                  required
                  minLength={50}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:outline focus:outline-2 focus:outline-[var(--brand)]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Symptoms, error codes, business impact…"
                />
                <p
                  className={cn(
                    "mt-1 text-xs",
                    descOk ? "text-emerald-400/90" : "text-amber-200/90",
                  )}
                >
                  {descLen} / 50 minimum ·{" "}
                  {descOk ? "Ready to submit" : `Add ${needChars} more character${needChars === 1 ? "" : "s"} to enable Submit`}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase text-[var(--text-secondary)]">
                    Affected system / app
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
                    value={affected}
                    onChange={(e) => setAffected(e.target.value)}
                    placeholder="e.g. POS / WLAN, laptop hostname…"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    If left blank or too short, &quot;General IT systems&quot; is sent (server requires at least 2
                    characters).
                  </p>
                </div>
                <div>
                  <label className="text-xs uppercase text-[var(--text-secondary)]">
                    Region / location
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-6 text-center"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Drag files here or add one attachment (first file is uploaded)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={onFilePick}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  Choose files
                </button>
                {files.length ? (
                  <ul className="mt-3 space-y-1 text-left font-mono text-xs text-[var(--text-primary)]">
                    {files.map((f) => (
                      <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2">
                        <span>
                          {f.name} — {(f.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(f.name)}
                          className="text-[var(--brand-light)] hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={!descOk}
                  title={
                    descOk
                      ? "Submit ticket"
                      : `Enter at least 50 characters in the description (${descLen} so far)`
                  }
                  className="flex-1 rounded-lg bg-[var(--brand)] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit ticket
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">How it works</h2>
            <ol className="mt-4 space-y-4 text-sm text-[var(--text-secondary)]">
              <li>
                <span className="font-mono text-[var(--brand)]">1.</span> Submit structured context
                for faster routing.
              </li>
              <li>
                <span className="font-mono text-[var(--brand)]">2.</span> The server classifies severity,
                urgency, and priority score.
              </li>
              <li>
                <span className="font-mono text-[var(--brand)]">3.</span> Your ticket appears in the IT queue
                and on your dashboard.
              </li>
            </ol>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Expected response time
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
              <li>Critical: &lt; 15 minutes acknowledgement</li>
              <li>High: &lt; 1 hour</li>
              <li>Medium / Low: same business day</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/10 p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Live status
            </p>
            <p className="mt-2 font-mono text-lg text-emerald-300">API submit: Ready</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
