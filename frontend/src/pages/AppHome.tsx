import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Default landing inside the app shell. */
export default function AppHome() {
  const { user } = useAuth();
  if (user?.role === "end_user") {
    return <Navigate to="/app/tickets" replace />;
  }
  return <Navigate to="/app/queue" replace />;
}
