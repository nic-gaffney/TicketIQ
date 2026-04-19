import { useAuth } from "../context/AuthContext";
import TicketList from "./TicketList";

export default function TicketsPage() {
  const { user } = useAuth();
  const title = user?.role === "end_user" ? "My tickets" : "All tickets";
  return <TicketList title={title} path="tickets" />;
}
