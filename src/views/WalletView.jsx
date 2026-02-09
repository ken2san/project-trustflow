import React from "react";
import { ArrowLeft, PlusCircle, QrCode, RefreshCw, Coins, Activity, TrendingUp, User } from "lucide-react";
import SpotlightCard from "../components/ui/SpotlightCard";
import ScrambleText from "../components/ui/ScrambleText";
import AnalyticsGraph from "../components/visual/AnalyticsGraph";

const WalletView = ({ onBack, isFlipped, setIsFlipped, userPoints, transactions, onDeposit, setIsPaymentModalOpen }) => (
    <div className="space-y-12 animate-fade-in-up">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] pl-2 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Feed</button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
                <SpotlightCard className="bg-gradient-to-br from-indigo-600 to-violet-900 rounded-[56px] p-8 sm:p-12 text-white shadow-[0_30px_80px_rgba(79,70,229,0.3)] group">
                    <div className="flex flex-col relative z-10 w-full h-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`transition-all duration-500 ${isFlipped ? 'opacity-0 absolute' : 'opacity-100'}`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                            <div className="flex justify-between items-start mb-6"><p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Net Liquidity</p><RefreshCw className="w-4 h-4 opacity-50" /></div>
                            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black italic mb-12 leading-none tracking-tighter break-words"><ScrambleText text={userPoints.toLocaleString()} /> <span className="text-sm not-italic opacity-60 block mt-4 uppercase tracking-widest font-bold">TrustPoints</span></h2>
                        </div>
                        <div className={`transition-all duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
                            <div className="flex flex-col h-full justify-between"><div className="flex justify-between items-start"><QrCode className="w-32 h-32 text-white/90" /><RefreshCw className="w-4 h-4 opacity-50" /></div><div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Wallet Address</p><p className="font-mono text-xs opacity-80 break-all">0x71C...9A21</p></div></div>
                        </div>
                        <div className={`space-y-5 relative z-10 transition-all duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <button onClick={(e) => { e.stopPropagation(); setIsPaymentModalOpen(true); }} className="w-full bg-white text-indigo-900 py-6 rounded-[32px] font-black text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"><PlusCircle className="w-6 h-6" /> Charge Wallet</button>
                            <button className="w-full bg-black/20 border border-white/20 text-white py-6 rounded-[32px] font-black text-lg hover:bg-white/10 transition-all active:scale-95">Withdraw Fiat</button>
                        </div>
                    </div>
                </SpotlightCard>
            </div>
            <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0f172a]/60 rounded-[56px] p-12 border border-white/5 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4"><Activity className="w-8 h-8 text-indigo-500" /> Revenue Stream</h3></div>
                    <AnalyticsGraph />
                    <div className="space-y-6 mt-8">{transactions.map(tx => (<div key={tx.id} className="flex items-center justify-between p-8 bg-white/[0.02] rounded-[36px] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer"><div className="flex items-center gap-8"><div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}><TrendingUp className={`w-8 h-8 ${tx.type === 'out' ? 'rotate-180' : ''}`} /></div><div><p className="font-black text-white text-xl tracking-tight group-hover:text-indigo-300 transition-colors">{tx.title}</p><p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2">{tx.id} • {tx.date}</p></div></div><div className="text-right"><p className={`text-3xl font-black italic tracking-tight ${tx.type === 'in' ? 'text-emerald-500' : 'text-slate-300'}`}>{tx.type === 'in' ? '+' : '-'}{tx.points.toLocaleString()}</p><span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none">PTS</span></div></div>))}</div>
                </div>
            </div>
        </div>
    </div>
);

export default WalletView;
