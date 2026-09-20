"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  itemName,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  loading      = false,
  variant      = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop — covers everything including topbar/bottomnav */}
      <div
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 9998 }}
        aria-hidden
        onClick={onCancel}
      />

      {/* Sheet / dialog — always on top of all page layers */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cdlg-title"
        className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-lg
                   bg-surface rounded-t-2xl px-5 pt-4 pb-8 shadow-sheet
                   sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-5"
        style={{ zIndex: 9999 }}
      >
        {/* Drag handle */}
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        <h2 id="cdlg-title" className="text-[16px] font-semibold text-t1">{title}</h2>

        {description && (
          <p className="mt-1.5 text-[14px] text-t2 leading-relaxed">{description}</p>
        )}
        {itemName && (
          <p className="mt-2 text-[14px] font-semibold text-t1 truncate">&ldquo;{itemName}&rdquo;</p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "inline-flex items-center justify-center gap-2 font-semibold text-[15px] rounded-md px-5 py-2.5 min-h-[44px] w-full sm:flex-1 transition-colors disabled:opacity-40",
              variant === "danger"
                ? "bg-danger text-white active:opacity-80"
                : "bg-green-600 text-white active:bg-green-700"
            )}
          >
            {loading && <Spinner size="sm" />}
            {loading ? "…" : confirmLabel}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary w-full sm:flex-1"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
