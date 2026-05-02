"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "user") router.replace("/dashboard");
    else if (user.role === "technician") router.replace("/technician/queue");
    else router.replace("/admin/overview");
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--dark-bg)] text-[var(--text-secondary)]">
      Redirecting…
    </div>
  );
}
