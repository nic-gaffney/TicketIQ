"use client";

import { format } from "date-fns";
import { userById } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/avatar";
import type { Note } from "@/lib/types";

export function InternalNoteThread({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">No internal notes yet.</p>
    );
  }
  return (
    <div className="space-y-3">
      {notes.map((n) => {
        const author = userById(n.authorId);
        const name = author?.name ?? n.authorId;
        const role = author?.role ?? "technician";
        return (
          <div
            key={n.noteId}
            className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)]/60 p-3"
          >
            <Avatar name={name} role={role} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                  {format(new Date(n.createdAt), "MMM d, HH:mm")}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {n.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
