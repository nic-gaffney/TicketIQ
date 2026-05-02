import { AppShell } from "@/components/layout/app-shell";
import { PortalGuard } from "@/components/auth/portal-guard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard>
      <AppShell>{children}</AppShell>
    </PortalGuard>
  );
}
