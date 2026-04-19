import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";

type Ticket = {
  id: number;
  description: string;
  affected_system: string;
  category: string;
  region: string | null;
  status: string;
  severity: string;
  urgency: string;
  priority_score: number;
  created_at: string;
};

type Props = {
  title: string;
  path: string;
  extraParams?: Record<string, string | boolean | undefined>;
};

export default function TicketList({ title, path, extraParams }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets", path, extraParams],
    queryFn: async () => {
      const { data } = await api.get<Ticket[]>(path, { params: extraParams });
      return data;
    },
  });

  if (isLoading) return <p className="text-gray-600">Loading…</p>;
  if (error) return <p className="text-red-600">Could not load tickets.</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <ul className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
        {data?.length === 0 && <li className="px-4 py-8 text-center text-gray-500">No tickets.</li>}
        {data?.map((t) => (
          <li key={t.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link to={`/app/tickets/${t.id}`} className="font-medium text-tmobile hover:underline">
                #{t.id} — {t.category}
              </Link>
              <p className="line-clamp-2 text-sm text-gray-600">{t.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-gray-100 px-2 py-0.5 capitalize">{t.status.replace("_", " ")}</span>
              <span className="rounded bg-tmobile/10 px-2 py-0.5 capitalize text-tmobile">{t.severity}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 capitalize">{t.urgency}</span>
              <span className="rounded bg-gray-900 px-2 py-0.5 text-white">P{t.priority_score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
