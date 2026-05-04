"use client";

// import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { userFromApi } from "@/lib/types";
import type { UserPublic } from "@/lib/types";
import { getStoredToken } from "@/contexts/auth-context";


export default function UserManagementPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  
  useEffect(() => {
    const token = getStoredToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(console.error);
  }, []);
  const isAdmin = (role: string) => role === "admin";
  const isItSupport = (role: string) => role === "it_support";
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
            {users.map((raw) => {
              const u = userFromApi(raw);
              return (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
