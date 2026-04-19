import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import TicketsPage from "./pages/TicketsPage";
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/app", element: _jsx(RequireAuth, { children: _jsx(AppShell, {}) }), children: [_jsx(Route, { index: true, element: _jsx(AppHome, {}) }), _jsx(Route, { path: "tickets", element: _jsx(TicketsPage, {}) }), _jsx(Route, { path: "queue", element: _jsx(RequireRole, { roles: ["it_support", "admin"], children: _jsx(QueuePage, {}) }) }), _jsx(Route, { path: "best-fit", element: _jsx(RequireRole, { roles: ["it_support", "admin"], children: _jsx(BestFitPage, {}) }) }), _jsx(Route, { path: "submit", element: _jsx(SubmitTicket, {}) }), _jsx(Route, { path: "tickets/:id", element: _jsx(TicketDetail, {}) }), _jsx(Route, { path: "admin/audit", element: _jsx(RequireRole, { roles: ["admin"], children: _jsx(AdminAuditPage, {}) }) }), _jsx(Route, { path: "admin/escalation", element: _jsx(RequireRole, { roles: ["admin"], children: _jsx(AdminEscalationPage, {}) }) })] })] }));
}
