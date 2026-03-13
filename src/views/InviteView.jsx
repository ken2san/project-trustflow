import React from "react";
import { ShieldCheck, ArrowRight, X, Star, Lock, CheckCircle2 } from "lucide-react";

const GAINS = [
  {
    icon: ShieldCheck,
    title: "You're protected from day one.",
    body: "Funds are held in escrow. Every message is evidence. If anything goes wrong, the record speaks for you — not the other person's version of events.",
  },
  {
    icon: Star,
    title: "Every contract builds your Trust Passport.",
    body: "Completed projects, on-time delivery, resolved disputes — all logged as tamper-evident records you own permanently. No platform owns your track record.",
  },
  {
    icon: Lock,
    title: "The agreement is locked before any money moves.",
    body: "What \"done\" means is agreed in writing before work starts. No more \"that's not what I asked for\" after delivery.",
  },
];

const InviteView = ({ inviteData, onAccept, onDecline }) => {
  const { inviter, project, amount, dod } = inviteData;
  const amountLabel = amount > 0 ? `${amount.toLocaleString()} PTS` : "TBD";

  return (
    <div className="space-y-10 animate-fade-in-up max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">You've been invited</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-none">
          {inviter} wants to work with you.
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
          They set up a TrustFlow contract — so both of you are protected, not just them.
        </p>
      </div>

      {/* Project card */}
      <div className="bg-[#0f172a]/80 border border-white/10 rounded-[40px] p-8 space-y-5 shadow-2xl backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Project</p>
          <h2 className="text-2xl font-black text-white tracking-tight">{project}</h2>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contract Value</p>
          <p className="text-3xl font-black italic text-white">{amountLabel}</p>
        </div>
        {dod.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Definition of Done</p>
            <div className="space-y-2">
              {dod.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* What you gain */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">What you get by joining</p>
        {GAINS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-[24px]">
            <div className="shrink-0 w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-black text-white text-sm mb-1">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 max-w-md mx-auto w-full pb-8">
        <button
          onClick={onAccept}
          className="w-full py-5 bg-white text-[#020617] rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-400 hover:text-white transition-all shadow-2xl"
        >
          Accept & Review Agreement
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onDecline}
          className="w-full py-4 border border-white/10 rounded-[24px] font-bold text-slate-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
        <p className="text-center text-xs text-slate-600">
          No payment or commitment yet — you review the full agreement before anything is locked.
        </p>
      </div>
    </div>
  );
};

export default InviteView;
