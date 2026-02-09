import React from "react";
import ScrambleText from "../ui/ScrambleText";

const MatchCircle = ({ score }) => (
    <div className="w-32 h-32 flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#1E293B" strokeWidth="6" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#indigoGradient)" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={(2 * Math.PI * 50) * (1 - score / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 text-center">
        <span className="text-4xl font-black italic text-white leading-none tracking-tighter">
          <ScrambleText text={`${score}%`} />
        </span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Match</span>
      </div>
    </div>
);

export default MatchCircle;
