"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { TicketProvider } from "@/contexts/ticket-context";
import { ToastProvider } from "@/contexts/toast-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TicketProvider>
        <ToastProvider>{children}</ToastProvider>
      </TicketProvider>
    </AuthProvider>
  );
}
