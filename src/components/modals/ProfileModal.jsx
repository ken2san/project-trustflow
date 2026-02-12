// filepath: src/components/modals/ProfileModal.jsx
import React from "react";
import { User, BadgeCheck, MapPin, Calendar, Hexagon, Activity, ShieldCheck, ArrowRight, Share2 } from "lucide-react";

const ProfileModal = ({ isOpen, onClose, profile: unifiedProfile, actionLabel, onAction, addToast }) => {
  if (!isOpen || !unifiedProfile) return null;
  const handleExport = () => addToast('Export Successful', 'Trust Passport downloaded as PDF.');
  const handleAction = () => { if (onAction) { onAction(); onClose(); } };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pt-12 sm:pt-0 p-2 sm:p-4">
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-lg" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[32px] sm:rounded-[48px] shadow-2xl animate-scale-up flex flex-col md:flex-row overflow-y-auto max-h-[90vh]">
        <div className="md:w-1/3 w-full bg-white/[0.02] p-4 sm:p-6 pb-2 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center text-center relative h-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-emerald-500 mb-6 pointer-events-none">
            <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
              <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 sm:w-8 sm:h-8 bg-[#0f172a] rounded-full border border-white/10 flex items-center justify-center text-emerald-400">
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 relative z-10 pointer-events-none">{unifiedProfile.name}</h2>
          <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-6 relative z-10 pointer-events-none">{unifiedProfile.role || "Elite Node"}</p>
          <div className="space-y-4 w-full relative z-10 pointer-events-none">
            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><MapPin className="w-4 h-4 text-indigo-500" /> {unifiedProfile.location || "Tokyo, Japan"}</div>
            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><Calendar className="w-4 h-4 text-indigo-500" /> Member since {unifiedProfile.joined || "2024"}</div>
            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><Hexagon className="w-4 h-4 text-indigo-500" /> Level {unifiedProfile.level || 1} Architect</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); actionLabel ? handleAction() : handleExport(); }} className={`mt-auto w-full py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors relative z-20 ${actionLabel ? 'bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl mb-1 shadow-lg' : 'text-slate-500 hover:text-white'}`}>{actionLabel ? <>Initiate Contract <ArrowRight className="w-4 h-4" /></> : <><Share2 className="w-4 h-4" /> Export Identity</>}</button>
        </div>
        <div className="flex-1 w-full p-6 sm:p-8 md:p-12 pb-32 space-y-10 relative h-auto">
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-500" /> Performance Metrics</h3>
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">Top 1% Global</span>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Core metrics only: Reliability, Avg. Rating, Completed Contracts, Disputes Resolved */}
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-2"><span>Reliability</span><span className="text-indigo-400">{unifiedProfile.trustScore ?? 80}%</span></div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${unifiedProfile.trustScore ?? 80}%` }} /></div>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-2"><span>Avg. Rating</span><span className="text-yellow-300">{unifiedProfile.avgRating ?? 5.0}★</span></div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500" style={{ width: `${(unifiedProfile.avgRating ?? 5.0) * 20}%` }} /></div>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-2"><span>Completed</span><span className="text-emerald-400">{unifiedProfile.completedContracts ?? 0}</span></div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min((unifiedProfile.completedContracts ?? 0) * 10, 100)}%` }} /></div>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-2"><span>Disputes Resolved</span><span className="text-indigo-200">{unifiedProfile.disputesResolved ?? 0}</span></div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-200 to-indigo-400" style={{ width: `${Math.min((unifiedProfile.disputesResolved ?? 0) * 20, 100)}%` }} /></div>
            </div>
          </div>
          {/* Subtle badge row for secondary metrics */}
          <div className="flex flex-wrap gap-2 my-4">
            <span className="px-3 py-1 bg-indigo-900/40 text-indigo-200 rounded-full text-xs font-bold">Skill Endorsements: {unifiedProfile.skillEndorsements ?? 0}</span>
            <span className="px-3 py-1 bg-indigo-900/40 text-indigo-200 rounded-full text-xs font-bold">Repeat Clients: {unifiedProfile.repeatClients ?? 0}</span>
            {unifiedProfile.responseSpeed && unifiedProfile.responseSpeed !== '—' && (
              <span className="px-3 py-1 bg-indigo-900/40 text-indigo-200 rounded-full text-xs font-bold">Response Speed: {unifiedProfile.responseSpeed}</span>
            )}
          </div>
          <div className="relative z-10">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Reputation Heatmap</h4>
            <div className="flex gap-1 h-12">{[...Array(30)].map((_, i) => (<div key={i} className={`flex-1 rounded-sm ${Math.random() > 0.5 ? 'bg-indigo-500/80' : Math.random() > 0.5 ? 'bg-indigo-500/40' : 'bg-white/5'}`} style={{ opacity: Math.random() * 0.5 + 0.5 }} />))}</div>
          </div>
          <div className="p-6 bg-indigo-900/20 border border-indigo-500/20 rounded-3xl flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30"><ShieldCheck className="w-6 h-6" /></div>
            <div><h4 className="text-white font-bold">TrustFlow Guarantee</h4><p className="text-xs text-indigo-300">Identity verified via decentralized ledger.</p></div>
            <div className="ml-auto text-2xl font-black text-white italic">100%</div>
          </div>
        </div>
        {/* 下部切り替えボタン群で閉じる/切り替えを担う */}
      </div>
    </div>
  );
};

export default ProfileModal;
