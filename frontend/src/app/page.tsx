"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Root URL always opens the login screen (session may still exist for API calls). */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--dark-bg)] text-[var(--text-secondary)]">
      Redirecting…
    </div>
  );
}
