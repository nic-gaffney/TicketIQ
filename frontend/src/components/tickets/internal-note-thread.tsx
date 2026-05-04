"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { Note } from "@/lib/types";
import type { UserPublic } from "@/lib/types";
import { getStoredToken } from "@/contexts/auth-context";

export function InternalNoteThread({ notes }: { notes: Note[] }) {

  useEffect(() => {
    const token = getStoredToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(console.error);
  }, []);

  const [users, setUsers] = useState<UserPublic[]>([]);
  
  const getUserById = (id: string | number) => 
    users.find((u) => u.id === Number(id)); 

  if (notes.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">No internal notes yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((n) => {
        const author = getUserById(n.authorId);
        const name = author?.full_name ?? n.authorId;
        const role = author?.role ?? "it_support";
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
