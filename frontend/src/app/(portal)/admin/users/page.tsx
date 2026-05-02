"use client";

import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">User management</h1>
        <p className="text-[var(--text-secondary)]">Directory sync preview (mock data).</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
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
            {MOCK_USERS.map((u) => (
              <tr key={u.userId} className="border-b border-[var(--border)]/60 table-row-interactive">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} role={u.role} size="sm" />
                    <span className="font-medium text-[var(--text-primary)]">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      u.role === "admin"
                        ? "role-admin"
                        : u.role === "technician"
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
      </div>
    </div>
  );
}
