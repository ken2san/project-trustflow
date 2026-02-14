import React, { useEffect, useRef } from "react";

/**
 * Generic modal dialog component for confirmations, forms, etc.
 * Props:
 * - open: boolean (show/hide)
 * - onClose: function (close handler)
 * - title: string (modal title)
 * - children: content (JSX)
 * - actions: JSX (footer actions/buttons)
 */
export default function ModalDialog({ open, onClose, title, children, actions }) {
  const dialogRef = useRef(null);
  // Focus trap and ESC to close
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog) dialog.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      // Trap focus inside modal
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" aria-modal="true" role="dialog">
      <div
        ref={dialogRef}
        className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 relative outline-none"
        tabIndex={-1}
        aria-labelledby="modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white text-xl font-bold"
          aria-label="Close dialog"
        >
          ×
        </button>
        {title && <h3 id="modal-title" className="text-xl font-bold text-white mb-2">{title}</h3>}
        <div>{children}</div>
        {actions && <div className="flex gap-4 justify-end mt-4">{actions}</div>}
      </div>
    </div>
  );
}
