import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

function initials(name: string) {
  const p = name.split(/\s+/).filter(Boolean);
  return (p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "");
}

const ring: Record<Role, string> = {
  user: "ring-zinc-500",
  technician: "ring-cyan-500",
  admin: "ring-fuchsia-500",
};

export function Avatar({
  name,
  role,
  size = "md",
  className,
}: {
  name: string;
  role: Role;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[var(--surface)] font-semibold text-[var(--text-primary)] ring-2 ring-offset-2 ring-offset-[var(--dark-bg)]",
        ring[role],
        sz,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
