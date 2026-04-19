import { useMemo, useState } from "react";
import TicketList from "./TicketList";

const STATUSES = ["", "open", "assigned", "in_progress", "resolved", "escalated"] as const;
const SEVERITIES = ["", "low", "medium", "high"] as const;

export default function QueuePage() {
  const [status_filter, setStatus] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [archived_only, setArchivedOnly] = useState(false);

  const extraParams = useMemo(
    () => ({
      ...(status_filter ? { status_filter } : {}),
      ...(severity ? { severity } : {}),
      ...(archived_only ? { archived_only: true } : {}),
    }),
    [status_filter, severity, archived_only],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="text-sm text-gray-700">
          Status
          <select
            className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            value={status_filter}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s.replace("_", " ") : "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Severity
          <select
            className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            {SEVERITIES.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={archived_only} onChange={(e) => setArchivedOnly(e.target.checked)} />
          Archived only (60d+ resolved)
        </label>
      </div>
      <TicketList title="Prioritized queue" path="tickets" extraParams={extraParams} />
    </div>
  );
}
