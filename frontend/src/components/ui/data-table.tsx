"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  className?: string;
  accessor?: (row: T) => string | number;
  cell: (row: T) => React.ReactNode;
};

type SortDir = "asc" | "desc";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyMessage = "No results.",
  page,
  pageSize,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
}) {
  const [sort, setSort] = useState<{ id: string; dir: SortDir } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortable || !col.accessor) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.accessor!(a);
      const vb = col.accessor!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [rows, sort, columns]);

  const visible = useMemo(() => {
    if (page == null || pageSize == null) return sorted;
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (id: string) => {
    const col = columns.find((c) => c.id === id);
    if (!col?.sortable) return;
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-secondary)]">
            {columns.map((c) => (
              <th
                key={c.id}
                className={cn("px-4 py-3 font-medium", c.className)}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                    onClick={() => toggleSort(c.id)}
                  >
                    {c.header}
                    {sort?.id === c.id ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : null}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[var(--text-secondary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            visible.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "table-row-interactive border-b border-[var(--border)]/60 transition-colors",
                  i % 2 === 1 && "bg-[var(--surface)]/25",
                  onRowClick && "cursor-pointer hover:bg-[var(--surface)]/50",
                )}
              >
                {columns.map((c) => (
                  <td key={c.id} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
