"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTechnicianSpecializations } from "@/hooks/use-technician-specializations";
import { ISSUE_CATEGORY_OPTIONS } from "@/lib/category-mapping";
import { isItSupport } from "@/lib/roles";
import type { IssueCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TechnicianProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.id;
  const { specializations, setSpecializations } = useTechnicianSpecializations(uid);
  const [draft, setDraft] = useState<IssueCategory[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && !isItSupport(user.role)) {
      router.replace("/admin/overview");
    }
  }, [user, router]);

  useEffect(() => {
    setDraft(specializations);
  }, [specializations]);

  const toggle = (c: IssueCategory) => {
    setDraft((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setSaved(false);
  };

  const onSave = () => {
    setSpecializations(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ready = useMemo(() => isItSupport(user?.role), [user]);

  if (!user || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/technician/queue"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>
        <h1 className="font-display text-3xl tracking-wide text-[var(--text-primary)]">My specializations</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Pick the same issue types end users choose when submitting a ticket. The queue highlights tickets that
          match your profile (stored on this browser until the API adds a profile field).
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <p className="mb-4 text-sm font-medium text-[var(--text-primary)]">Issue types you handle</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ISSUE_CATEGORY_OPTIONS.map(({ value, label }) => {
            const on = draft.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggle(value)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition",
                  on
                    ? "border-[var(--brand)] bg-[var(--surface)] text-white"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40",
                )}
              >
                <span>{label}</span>
                {on ? <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-light)]"
          >
            Save specializations
          </button>
          {saved ? (
            <span className="text-sm text-emerald-400">Saved — queue will use these for “Recommended for you”.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
