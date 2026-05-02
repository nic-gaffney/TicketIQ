"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-t-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-lift sm:rounded-2xl",
              className,
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              {title ? (
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
