import React, { useState, useCallback } from "react";
import { CheckCircle2, Lock, Scan, User, Star, ArrowRight, UploadCloud, Fingerprint } from "lucide-react";
import HoldButton from "../components/ui/HoldButton";

const STEPS_DATA = [
  { id: 1, label: 'PROTOCOL' },
  { id: 2, label: 'ESCROW' },
  { id: 3, label: 'INSPECT' },
  { id: 4, label: 'RATING' }
];

const ContractView = ({ step, handleNextStep, handleReject, isUploading, uploadProgress, handleFileUpload, status, formatNumber }) => {
    const [rating, setRating] = useState(0);
    return (
    <div className="animate-fade-in-up space-y-16">
        <div className="mb-16 flex justify-between items-center max-w-2xl mx-auto relative px-4">
            {STEPS_DATA.map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center z-10"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-700 ${step > s.id ? 'bg-emerald-500 text-white shadow-lg' : step === s.id ? 'bg-indigo-600 text-white scale-110 shadow-2xl' : 'bg-slate-800 border border-white/5 text-slate-600'}`}>{step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black italic text-lg tracking-tighter">{s.id}</span>}</div><span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === s.id ? 'text-white' : 'text-slate-600'}`}>{s.label}</span></div>
                    {idx < STEPS_DATA.length - 1 && (<div className="flex-1 h-0.5 bg-slate-800 mx-2 -mt-10 relative overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: step > s.id ? '100%' : '0%' }} /></div>)}
                </React.Fragment>
            ))}
        </div>
        <div className="max-w-4xl mx-auto bg-[#0f172a]/40 rounded-[56px] p-8 sm:p-16 border border-white/[0.05] min-h-[500px] shadow-2xl backdrop-blur-2xl text-center">
            {step === 1 && (<div className="space-y-10 animate-fade-in-up"><h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white leading-none">Commitment Locked</h2><p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">Funds are moving to the decentralized vault. <br/> This action is immutable.</p><HoldButton key="btn-1" onClick={handleNextStep} label="Activate Trust Stream" icon={ArrowRight} className="w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-2xl" color="white" disabled={status !== 'idle'} /></div>)}
            {step === 2 && (<div className="space-y-10 animate-fade-in-up"><div className="w-32 h-32 bg-indigo-500/10 rounded-[48px] flex items-center justify-center border border-indigo-500/20 rotate-12 mx-auto"><Lock className="w-14 h-14 text-indigo-400 -rotate-12" /></div><h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Vault Secured</h2>{isUploading ? (<div className="space-y-8 max-w-md mx-auto"><div className="w-32 h-32 mx-auto relative flex items-center justify-center"><svg className="w-full h-full -rotate-90"><circle cx="64" cy="64" r="50" fill="none" stroke="#1e293b" strokeWidth="8" /><circle cx="64" cy="64" r="50" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 - (314 * uploadProgress / 100)} strokeLinecap="round" className="transition-all duration-100" /></svg><span className="absolute text-2xl font-black text-white">{uploadProgress}%</span></div><p className="text-indigo-400 font-black tracking-widest uppercase animate-pulse">Scanning Artifacts...</p></div>) : (<div className="max-w-md mx-auto space-y-4"><div className="border-4 border-dashed border-white/10 rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group" onClick={handleFileUpload}><div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8 text-indigo-400" /></div><h3 className="text-xl font-black text-white">Upload Deliverables</h3></div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Or skip to next phase</p><HoldButton key="btn-2" onClick={handleNextStep} label="Enter Build Phase" className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl" color="indigo" disabled={status !== 'idle'} /></div>)}</div>)}
            {step === 3 && (<div className="space-y-10 animate-fade-in-up"><div className="w-32 h-32 bg-amber-500/10 rounded-[48px] flex items-center justify-center border border-amber-500/20 mx-auto animate-pulse"><Scan className="w-14 h-14 text-amber-500" /></div><h2 className="text-5xl font-black text-white italic tracking-tighter">Neural Inspection</h2><div className="bg-black/20 p-6 rounded-2xl border border-white/5 max-w-md mx-auto"><p className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> 98.2% Match Verified</p></div><div className="flex justify-center gap-4 max-w-md mx-auto"><button onClick={handleReject} className="flex-1 py-6 rounded-[32px] border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white font-bold transition-all">Reject</button><HoldButton key="btn-3" onClick={handleNextStep} label="Release Funds" className="flex-[2] bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} /></div></div>)}
            {step === 4 && (
                <div className="space-y-12 animate-fade-in-up">
                    <div className="flex flex-col items-center gap-6"><div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px]"><div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden"><User className="w-12 h-12 text-slate-300" /></div></div><div><h2 className="text-4xl font-black text-white mb-2">Rate Experience</h2><p className="text-slate-400">Feedback updates the Neural Trust Score.</p></div><div className="flex gap-4">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setRating(star)} className="group focus:outline-none transition-transform active:scale-90"><Star className={`w-10 h-10 transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-700 group-hover:text-slate-500'}`} /></button>))}</div></div>
                    {rating > 0 ? (<div className="animate-fade-in-up"><HoldButton key="btn-4" onClick={handleNextStep} label="Commit & Close" className="w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} /></div>) : (<p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Select stars to finalize</p>)}
                </div>
            )}
            {step === 5 && (<div className="space-y-10 animate-fade-in-up"><div className="w-32 h-32 bg-emerald-500/10 rounded-[48px] flex items-center justify-center border border-emerald-500/20 mx-auto"><CheckCircle2 className="w-16 h-16 text-emerald-500 animate-scale-up" /></div><h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Settled</h2><button onClick={handleNextStep} className="px-10 py-4 rounded-full border border-white/10 hover:bg-white/10 text-white font-bold transition-all">Return to Feed</button></div>)}
        </div>
    </div>
    );
};

export default ContractView;
