import React from "react";

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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white text-xl font-bold"
          aria-label="Close dialog"
        >
          ×
        </button>
        {title && <h3 className="text-xl font-bold text-white mb-2">{title}</h3>}
        <div>{children}</div>
        {actions && <div className="flex gap-4 justify-end mt-4">{actions}</div>}
      </div>
    </div>
  );
}
