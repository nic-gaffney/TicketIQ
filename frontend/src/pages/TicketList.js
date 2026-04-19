import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";
export default function TicketList({ title, path, extraParams }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["tickets", path, extraParams],
        queryFn: async () => {
            const { data } = await api.get(path, { params: extraParams });
            return data;
        },
    });
    if (isLoading)
        return _jsx("p", { className: "text-gray-600", children: "Loading\u2026" });
    if (error)
        return _jsx("p", { className: "text-red-600", children: "Could not load tickets." });
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: title }), _jsxs("ul", { className: "mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm", children: [data?.length === 0 && _jsx("li", { className: "px-4 py-8 text-center text-gray-500", children: "No tickets." }), data?.map((t) => (_jsxs("li", { className: "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsxs(Link, { to: `/app/tickets/${t.id}`, className: "font-medium text-tmobile hover:underline", children: ["#", t.id, " \u2014 ", t.category] }), _jsx("p", { className: "line-clamp-2 text-sm text-gray-600", children: t.description })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [_jsx("span", { className: "rounded bg-gray-100 px-2 py-0.5 capitalize", children: t.status.replace("_", " ") }), _jsx("span", { className: "rounded bg-tmobile/10 px-2 py-0.5 capitalize text-tmobile", children: t.severity }), _jsx("span", { className: "rounded bg-gray-100 px-2 py-0.5 capitalize", children: t.urgency }), _jsxs("span", { className: "rounded bg-gray-900 px-2 py-0.5 text-white", children: ["P", t.priority_score] })] })] }, t.id)))] })] }));
}
