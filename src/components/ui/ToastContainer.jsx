import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const ToastContainer = React.memo(({ toasts, removeToast }) => (
  <div className="fixed top-24 right-6 z-[70] flex flex-col gap-3 pointer-events-none">
    {toasts.map(toast => (
      <div key={toast.id} className="pointer-events-auto bg-[#0f172a]/95 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in-right max-w-sm backdrop-blur-xl">
        <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}</div>
        <div><h4 className="font-bold text-sm">{toast.title}</h4><p className="text-xs text-slate-400 mt-0.5">{toast.message}</p></div>
        <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white ml-auto"><X className="w-4 h-4" /></button>
      </div>
    ))}
  </div>
));

export default ToastContainer;
