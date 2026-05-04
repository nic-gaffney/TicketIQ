"use client";

import Link from "next/link";

export default function AiConfigPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">AI &amp; automation</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Ticket classification and priority scoring run in the{" "}
          <strong className="text-[var(--text-primary)]">backend</strong> when tickets are created
          (see <code className="text-xs text-[var(--brand)]">classify_ticket</code> /{" "}
          <code className="text-xs text-[var(--brand)]">compute_priority_score</code> in the API).
          There is no separate &quot;AI weights&quot; REST resource yet—this page routes you to the
          controls that <em>are</em> wired to the server.
        </p>
      </div>

      <ul className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 text-sm">
        <li>
          <Link href="/admin/escalation-rules" className="font-medium text-[var(--brand)] hover:underline">
            Escalation rules &amp; manual overrides
          </Link>
          <p className="mt-1 text-[var(--text-secondary)]">
            Edit auto-escalation thresholds and run the escalation job—backed by{" "}
            <code className="text-xs">/api/v1/admin/escalation</code>.
          </p>
        </li>
        <li>
          <Link href="/reports" className="font-medium text-[var(--brand)] hover:underline">
            Reports
          </Link>
          <p className="mt-1 text-[var(--text-secondary)]">
            Weekly resolved-by-department and escalation stats from{" "}
            <code className="text-xs">/api/v1/reports/*</code>.
          </p>
        </li>
        <li>
          <Link href="/admin/audit-log" className="font-medium text-[var(--brand)] hover:underline">
            Audit log
          </Link>
          <p className="mt-1 text-[var(--text-secondary)]">
            Full event stream from <code className="text-xs">/api/v1/audit</code>.
          </p>
        </li>
        <li>
          <Link href="/admin/overview" className="font-medium text-[var(--brand)] hover:underline">
            Operations overview
          </Link>
          <p className="mt-1 text-[var(--text-secondary)]">
            Live counts from loaded tickets and audit entries.
          </p>
        </li>
      </ul>
    </div>
  );
}
