import React from "react";
import { ArrowLeft, ListChecks, CheckCircle2, Fingerprint } from "lucide-react";
import ScrambleText from "../components/ui/ScrambleText";


const ScopingView = ({ selectedItem, onBack, onInitiate, scrambleTrigger, formatNumber }) => {
    if (!selectedItem) {
        return <div className="text-red-500 font-bold p-8">No item selected for scoping.</div>;
    }
    const acceptanceCriteria = Array.isArray(selectedItem.acceptanceCriteria)
        ? selectedItem.acceptanceCriteria
        : [];

    return (
        <div className="space-y-12 animate-fade-in-up">
            <button onClick={onBack} className="flex items-center gap-3 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] group pl-2"><ArrowLeft className="w-3 h-3" /> Abort Sequence</button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-[#0f172a]/60 rounded-[48px] p-10 sm:p-14 border border-white/5 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20"><ListChecks className="w-6 h-6 text-indigo-400" /></div><div><h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic text-white leading-none">Acceptance Protocol</h1><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Definition of Done (DoD)</p></div></div>
                    <div className="space-y-4">
                        {acceptanceCriteria.length > 0 ? (
                            acceptanceCriteria.map((c, i) => (
                                <div key={i} className="flex items-start gap-5 p-5 bg-white/[0.02] rounded-[24px] border border-white/5 hover:bg-white/[0.04] transition-all">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="font-bold text-slate-300 text-sm leading-relaxed">{c}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-400 italic">No acceptance criteria defined.</div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0f172a]/80 rounded-[48px] p-10 border border-white/10 shadow-2xl sticky top-32 backdrop-blur-xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Contract Value</p>
                        <h2 className="text-5xl font-black italic text-white mb-10 leading-none tracking-tighter"><ScrambleText text={formatNumber(selectedItem.totalPoints)} trigger={scrambleTrigger} /> <span className="text-sm not-italic text-slate-500 block mt-2 uppercase tracking-widest font-bold">TrustPoints</span></h2>
                        <button onClick={onInitiate} className="w-full bg-white text-[#020617] py-6 rounded-[24px] font-black text-lg hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"><Fingerprint className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" /> Sign & Fund</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScopingView;
