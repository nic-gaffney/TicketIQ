import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
