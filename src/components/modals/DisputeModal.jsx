// filepath: src/components/modals/DisputeModal.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Scale, X, User, Shield, Cpu, ChevronRight, CheckCircle2 } from "lucide-react";

const REASONS = [
  "Deliverable does not match Definition of Done",
  "Quality clearly below agreed threshold",
  "Scope changed without mutual agreement",
  "Other (specify below)",
];

const ARBITERS = [
  { id: "ai", label: "AI Arbitrator", desc: "Fast · Algorithm-based · ~15 min", icon: Cpu },
  { id: "human", label: "Certified Human Arbiter", desc: "Trusted reviewer · 24–48h · Binding", icon: User },
  { id: "panel", label: "Peer Panel", desc: "3 verified peers · 48–72h · Community consensus", icon: Shield },
];

const DisputeModal = ({ isOpen, onClose, onResolve }) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedArbiter, setSelectedArbiter] = useState(null);

  useEffect(() => {
    if (isOpen) { setStep(1); setReason(""); setCustomReason(""); setSelectedArbiter(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOther = reason === "Other (specify below)";
  const reasonValid = reason && (!isOther || customReason.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-lg" onClick={onClose} />
      <div className="relative bg-[#0f172a] border border-rose-500/30 w-full max-w-lg rounded-[40px] p-8 shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden animate-scale-up space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <Scale className="w-6 h-6" />
            <h3 className="text-xl font-black">Dispute Escalation</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? "bg-rose-500" : "bg-slate-800"}`} />
          ))}
        </div>

        {/* Step 1: Reason */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">What is the basis for this dispute?</p>
            {REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`w-full text-left p-4 rounded-2xl border transition-all font-bold text-sm flex justify-between group ${reason === r ? "border-rose-500/50 bg-rose-500/10 text-white" : "border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-300"}`}>
                {r} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {isOther && (
              <textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Describe the issue..." rows={3}
                className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-rose-500/40 resize-none" />
            )}
            <button disabled={!reasonValid} onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-500 disabled:opacity-40 transition-all">
              Next: Review Evidence →
            </button>
          </div>
        )}

        {/* Step 2: Evidence summary */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">The following evidence will be submitted to the arbiter:</p>
            <div className="space-y-2">
              {[
                { label: "Dispute Reason", value: isOther ? customReason : reason },
                { label: "Negotiation chat log", value: "Included automatically" },
                { label: "All deliverables + versions", value: "Included automatically" },
                { label: "Definition of Done (DoD)", value: "Included automatically" },
                { label: "Full contract timeline", value: "Included automatically" },
              ].map(e => (
                <div key={e.label} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><p className="text-xs font-black text-slate-300">{e.label}</p><p className="text-xs text-slate-500">{e.value}</p></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:text-white transition-all">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-500 transition-all">Choose Arbiter →</button>
            </div>
          </div>
        )}

        {/* Step 3: Arbiter selection */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Select who will review this dispute:</p>
            {ARBITERS.map(({ id, label, desc, icon: Icon }) => (
              <button key={id} onClick={() => setSelectedArbiter(id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedArbiter === id ? "border-rose-500/50 bg-rose-500/10" : "border-white/5 bg-white/5 hover:border-rose-500/30"}`}>
                <div className="flex items-center gap-4">
                  <Icon className={`w-6 h-6 shrink-0 ${selectedArbiter === id ? "text-rose-400" : "text-slate-400"}`} />
                  <div>
                    <p className={`font-black text-sm ${selectedArbiter === id ? "text-white" : "text-slate-300"}`}>{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:text-white transition-all">Back</button>
              <button disabled={!selectedArbiter} onClick={() => { setStep(4); setTimeout(() => onResolve(), 2500); }}
                className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-500 disabled:opacity-40 transition-all">
                Submit Dispute →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <h3 className="text-xl font-black text-rose-400 mb-2">Submitting Evidence</h3>
              <p className="text-xs text-slate-500 tracking-widest uppercase animate-pulse">
                Routing to {ARBITERS.find(a => a.id === selectedArbiter)?.label}…
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DisputeModal;
