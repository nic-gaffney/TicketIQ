"use client";

import { Modal } from "./modal";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description ? (
        <p className="mb-6 text-sm text-[var(--text-secondary)]">{description}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={[
            "rounded-lg px-4 py-2 text-sm font-medium text-white",
            danger ? "bg-red-700 hover:bg-red-600" : "bg-[var(--brand)] hover:bg-[var(--brand-light)]",
          ].join(" ")}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
