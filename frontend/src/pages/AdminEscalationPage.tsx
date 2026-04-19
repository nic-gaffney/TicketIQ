import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import api from "../api/client";

type Config = {
  id: number;
  high_unassigned_threshold_minutes: number;
  job_interval_seconds: number;
  notification_target: string;
  updated_at: string;
};

export default function AdminEscalationPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["escalation-config"],
    queryFn: async () => {
      const { data } = await api.get<Config>("admin/escalation");
      return data;
    },
  });

  const [threshold, setThreshold] = useState("");
  const [interval, setInterval] = useState("");
  const [notify, setNotify] = useState("");

  const runCheck = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ tickets_escalated: number }>("admin/escalation/run-check");
      return data.tickets_escalated;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch("admin/escalation", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escalation-config"] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (threshold) body.high_unassigned_threshold_minutes = Number(threshold);
    if (interval) body.job_interval_seconds = Number(interval);
    if (notify) body.notification_target = notify;
    if (Object.keys(body).length) save.mutate(body);
  }

  if (isLoading || !data) return <p className="text-gray-600">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Escalation rules</h2>
        <p className="mt-1 text-sm text-gray-600">
          High severity, unassigned tickets past the threshold are auto-escalated (background job every{" "}
          {data.job_interval_seconds}s in config; dev default may differ in server env).
        </p>
      </div>
      <dl className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Threshold (minutes)</dt>
          <dd className="font-medium">{data.high_unassigned_threshold_minutes}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Job interval (seconds)</dt>
          <dd className="font-medium">{data.job_interval_seconds}</dd>
        </div>
        <div className="py-1">
          <dt className="text-gray-500">Notification target</dt>
          <dd className="font-mono text-xs">{data.notification_target}</dd>
        </div>
      </dl>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">New threshold (minutes)</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={String(data.high_unassigned_threshold_minutes)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">New job interval (seconds)</label>
          <input
            type="number"
            min={60}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            placeholder={String(data.job_interval_seconds)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Notification target</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={notify}
            onChange={(e) => setNotify(e.target.value)}
            placeholder={data.notification_target}
          />
        </div>
        <button type="submit" className="rounded-lg bg-tmobile px-4 py-2 text-sm font-medium text-white hover:bg-tmobile-dark">
          Save changes
        </button>
      </form>
      <button
        type="button"
        onClick={() => runCheck.mutate()}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
      >
        Run escalation check now
      </button>
      {runCheck.isSuccess && (
        <p className="text-sm text-gray-600">Last run: {runCheck.data} ticket(s) escalated.</p>
      )}
    </div>
  );
}
