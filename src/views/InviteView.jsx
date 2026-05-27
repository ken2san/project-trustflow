import React, { useState } from "react";
import { ShieldCheck, ArrowRight, X, Star, Lock, CheckCircle2, User } from "lucide-react";

const GAINS = [
  {
    icon: ShieldCheck,
    title: "You're protected from day one.",
    body: "Every message is a timestamped record. If anything goes wrong, the evidence speaks for you — not the other person's version of events.",
  },
  {
    icon: Star,
    title: "Every contract builds your Trust Passport.",
    body: "Completed projects, on-time delivery, resolved disputes — all logged as tamper-evident records you own permanently.",
  },
  {
    icon: Lock,
    title: "The agreement is locked before any money moves.",
    body: "What \"done\" means is agreed in writing before work starts. No more \"that's not what I asked for\" after delivery.",
  },
];

// Stage 1: read-only review. Stage 2: lightweight identity (display name only). Stage 3 = onAccept fires.
const InviteView = ({ inviteData, onAccept, onDecline }) => {
  const { inviter, project, amount, dod } = inviteData;
  const amountLabel = amount > 0 ? `¥${amount.toLocaleString()}` : "TBD";
  const [stage, setStage] = useState('review'); // 'review' | 'identify'
  const [displayName, setDisplayName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  if (stage === 'identify') {
    return (
      <div className="space-y-8 animate-fade-in-up max-w-md mx-auto">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-[20px] flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white">How should we address you?</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            Your replies and actions on this contract will be recorded under this name.
            No account required yet.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && displayName.trim()) onAccept(displayName.trim(), guestEmail.trim() || null); }}
            placeholder="Your name or handle"
            autoFocus
            className="w-full bg-[#0f172a] border border-white/10 focus:border-indigo-500/50 rounded-2xl px-6 py-5 text-white text-lg font-bold outline-none transition-all placeholder:text-slate-600"
          />
          <div className="space-y-1">
            <input
              type="email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              placeholder="Email address (optional)"
              className="w-full bg-[#0f172a] border border-white/10 focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-white font-medium outline-none transition-all placeholder:text-slate-600"
            />
            <p className="text-xs text-slate-600 px-2">We'll send you a copy of the agreement for your records.</p>
          </div>
          <button
            onClick={() => onAccept(displayName.trim() || 'Guest', guestEmail.trim() || null)}
            className="w-full py-5 bg-white text-[#020617] rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-400 hover:text-white transition-all shadow-2xl"
          >
            Continue to Agreement
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setStage('review')}
            className="w-full py-3 text-slate-600 hover:text-slate-400 transition-colors font-bold text-sm"
          >
            ← Back
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          You can create a full account later to save your Trust Passport.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">You've been invited</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-none">
          {inviter} wants to work with you.
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
          They set up a TrustFlow contract — so both sides are protected, not just them.
        </p>
        <p className="text-xs font-bold text-slate-500">No account required to review.</p>
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
          onClick={() => setStage('identify')}
          className="w-full py-5 bg-white text-[#020617] rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-400 hover:text-white transition-all shadow-2xl"
        >
          Review Agreement
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onDecline}
          className="w-full py-4 border border-white/10 rounded-[24px] font-bold text-slate-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <X className="w-4 h-4" />
          Not interested
        </button>
        <p className="text-center text-xs text-slate-600">
          No payment or commitment at this stage — you review the full terms before anything is locked.
        </p>
      </div>
    </div>
  );
};

export default InviteView;
