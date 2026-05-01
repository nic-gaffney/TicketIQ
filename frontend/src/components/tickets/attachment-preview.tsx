import { Download, File } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export function AttachmentPreview({
  name,
  sizeBytes,
}: {
  name: string;
  sizeBytes?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <File className="h-4 w-4 shrink-0 text-[var(--brand)]" />
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-[var(--text-primary)]">{name}</p>
          {sizeBytes != null ? (
            <p className="text-xs text-[var(--text-secondary)]">{formatFileSize(sizeBytes)}</p>
          ) : null}
        </div>
      </div>
      <a
        href="#"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]"
        onClick={(e) => e.preventDefault()}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
    </div>
  );
}
