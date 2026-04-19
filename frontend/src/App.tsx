import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminEscalationPage from "./pages/AdminEscalationPage";
import AppHome from "./pages/AppHome";
import BestFitPage from "./pages/BestFitPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import QueuePage from "./pages/QueuePage";
import SubmitTicket from "./pages/SubmitTicket";
import TicketDetail from "./pages/TicketDetail";
import TicketsLayout from "./pages/TicketsLayout";
import TicketsPage from "./pages/TicketsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<AppHome />} />
        <Route path="tickets" element={<TicketsLayout />}>
          <Route index element={<TicketsPage />} />
          <Route path=":id" element={<TicketDetail />} />
        </Route>
        <Route
          path="queue"
          element={
            <RequireRole roles={["it_support", "admin"]}>
              <QueuePage />
            </RequireRole>
          }
        />
        <Route
          path="best-fit"
          element={
            <RequireRole roles={["it_support", "admin"]}>
              <BestFitPage />
            </RequireRole>
          }
        />
        <Route path="submit" element={<SubmitTicket />} />
        <Route
          path="admin/audit"
          element={
            <RequireRole roles={["admin"]}>
              <AdminAuditPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/escalation"
          element={
            <RequireRole roles={["admin"]}>
              <AdminEscalationPage />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}
