"use client";

import { BookOpen } from "lucide-react";

export default function KnowledgeBasePage() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-10 text-center">
      <BookOpen className="mx-auto h-12 w-12 text-[var(--brand)]" />
      <h1 className="mt-4 font-display text-3xl text-[var(--text-primary)]">Knowledge base</h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Playbooks and runbooks will surface here from Confluence sync (placeholder).
      </p>
    </div>
  );
}
