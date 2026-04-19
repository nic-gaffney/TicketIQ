import { Outlet } from "react-router-dom";

/** Parent layout so `/app/tickets` and `/app/tickets/:id` never compete as ambiguous siblings. */
export default function TicketsLayout() {
  return <Outlet />;
}
