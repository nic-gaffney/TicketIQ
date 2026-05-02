"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "user") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user && user.role === "user") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return <>{children}</>;
}
