"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import type { UserPublic } from "@/contexts/auth-context";
import { apiFetchJson } from "@/lib/api-fetch";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { isAdmin, isItSupport } from "@/lib/roles";

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetchJson<UserPublic[]>("/api/v1/admin/users");
      setUsers(list);
    } catch (e: unknown) {
      toast({
        title: "Failed to load users",
        description: e instanceof Error ? e.message : String(e),
        kind: "error",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">User management</h1>
          <p className="text-[var(--text-secondary)]">
            Directory from <code className="text-xs text-[var(--brand)]">GET /api/v1/admin/users</code>{" "}
            (read-only).
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
        {loading ? (
          <p className="p-8 text-center text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Region</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/60 table-row-interactive">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.full_name} role={u.role} size="sm" />
                      <span className="font-medium text-[var(--text-primary)]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        isAdmin(u.role)
                          ? "role-admin"
                          : isItSupport(u.role)
                            ? "role-tech"
                            : "role-user"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{u.department ?? "—"}</td>
                  <td className="px-4 py-3">{u.region ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
