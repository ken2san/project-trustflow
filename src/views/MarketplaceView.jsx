import React from "react";
import SpotlightCard from "../components/ui/SpotlightCard";
import ScrambleText from "../components/ui/ScrambleText";
import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, FileSignature, CheckCircle2 } from "lucide-react";

const MarketplaceView = ({ mode, jobs, talents, onViewDetails, projectPrompt, setProjectPrompt, handleAIArchitectSubmit, aiSuggestions, scrambleTrigger, formatNumber, onHire }) => (
    <div className="space-y-16 animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="shrink-0 relative group">
                <div className="w-32 h-32 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40px] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700" />
                    <div className="w-full h-full bg-[#0a0f1e] border border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden backdrop-blur-3xl">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent blur-[0.5px] animate-scan shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        <BrainCircuit className="text-indigo-400 w-16 h-16 relative z-10 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)] animate-pulse" />
                    </div>
                </div>
                <div className="absolute -bottom-2 -right-2 z-20">
                    <div className="w-12 h-12 bg-[#050b14] rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400 backdrop-blur-md">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white leading-[0.9]">
                    {/* Typewriter removed for MVP slimdown */}
                </h1>
                <p className="text-slate-400 text-lg"><span className="text-indigo-400 font-bold">2 high-match opportunities</span> found based on your profile.</p>
            </div>
        </div>
        {mode === 'earner' ? (
            <div className="grid grid-cols-1 gap-8">
                {jobs.map(item => (
                    <SpotlightCard key={item.id} className="rounded-[40px] p-8 group">
                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full">
                            {/* MatchCircle removed for MVP slimdown */}
                            <div className="flex-1 space-y-6 text-center md:text-left min-w-0">
                                <div><h3 className="text-3xl font-black text-white mb-2">{item.title}</h3><p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{item.client}</p></div>
                                <div className="relative pl-6 border-l-2 border-indigo-500/30"><p className="text-sm sm:text-lg font-medium leading-relaxed text-slate-300 italic">"{item.matchReason}"</p></div>
                                <div className="flex flex-wrap gap-8 justify-center md:justify-start pt-2"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reward</p><p className="text-2xl font-black italic text-white leading-none tracking-tight"><ScrambleText text={formatNumber(item.totalPoints)} trigger={scrambleTrigger} /> <span className="text-xs not-italic text-slate-500 font-bold">PTS</span></p></div></div>
                            </div>
                            <div className="shrink-0 w-full md:w-auto mt-6 md:mt-0 md:ml-auto">
                              <button className="w-full md:w-auto bg-white text-[#020617] px-10 py-5 rounded-[24px] font-black text-lg hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3" onClick={() => onViewDetails(item)}>
                                View Details <ArrowRight className="w-5 h-5" />
                              </button>
                            </div>
                        </div>
                    </SpotlightCard>
                ))}
            </div>
        ) : (
            <div className="space-y-16 animate-fade-in-up">
                {!aiSuggestions ? (
                    <div className="max-w-3xl mx-auto text-center space-y-10">
                        <div className="w-20 h-20 bg-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]"><BrainCircuit className="w-10 h-10 text-emerald-400" /></div>
                        <div><h1 className="text-5xl font-black text-white tracking-tighter mb-4">Scope Builder</h1><p className="text-slate-400 text-lg">Describe what you need. We'll convert it into a clear Definition of Done — your enforceable agreement before any funds move.</p></div>
                        <div className="relative"><textarea value={projectPrompt} onChange={(e) => setProjectPrompt(e.target.value)} placeholder="e.g., I need a React Native developer..." className="w-full bg-[#0f172a] border border-white/10 rounded-[32px] p-8 text-lg text-white outline-none focus:border-emerald-500/50 transition-all min-h-[200px] resize-none shadow-2xl" /><div className="absolute bottom-6 right-6"><button onClick={handleAIArchitectSubmit} disabled={!projectPrompt.trim()} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"><Sparkles className="w-4 h-4" /> Define Scope</button></div></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="bg-[#0f172a] border border-white/10 rounded-[48px] p-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
                            <div className="flex items-start gap-6 mb-8"><div className="p-3 bg-emerald-500/10 rounded-xl"><FileSignature className="w-6 h-6 text-emerald-400" /></div><div><h2 className="text-2xl font-black text-white mb-2">Agreement Draft Ready</h2><p className="text-slate-400">{aiSuggestions.summary}</p></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Definition of Done</h4><ul className="space-y-3">{aiSuggestions.dod.map((item, i) => (<li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}</li>))}</ul></div>
                                <div className="bg-white/5 rounded-3xl p-6"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recommended Budget</h4><p className="text-3xl font-black text-white">{aiSuggestions.budget}</p></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {aiSuggestions.candidates.map(talent => (
                                <SpotlightCard key={talent.id} className="rounded-[32px] p-8 cursor-pointer group" onClick={() => onSelect(talent)}>
                                    <div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-white">{talent.name[0]}</div><div><h4 className="font-bold text-white text-lg">{talent.name}</h4><p className="text-xs text-slate-400 uppercase tracking-wider">{talent.role}</p></div></div><div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black">{talent.aiScore}% Match</div></div>
                                    <p className="text-sm text-slate-300 mb-6 italic border-l-2 border-indigo-500/30 pl-4 py-1">"{talent.matchReason}"</p>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-4"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Est. Rate</p><p className="text-white font-mono font-bold text-lg">{formatNumber(talent.rate)} <span className="text-slate-500 text-xs">PTS / day</span></p></div><button className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors" onClick={e => { e.stopPropagation(); onHire && onHire(talent); }}>Hire</button></div>
                                </SpotlightCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
);

export default MarketplaceView;
