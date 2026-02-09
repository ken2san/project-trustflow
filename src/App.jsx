import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ShieldCheck, ArrowRight, Lock, Unlock, CheckCircle2, AlertCircle,
  MessageSquare, Wallet, Coins, PlusCircle, Search, Sparkles, Zap,
  ArrowLeft, ListChecks, Activity, TrendingUp, Globe, Award,
  BadgeCheck, UploadCloud, X, Send, Paperclip, Fingerprint, Scale,
  BrainCircuit, Target, UserCheck, LayoutGrid, Bell, CreditCard,
  Loader2, Check, MousePointer2, FileSignature, Scan, Hash,
  RefreshCw, QrCode, Briefcase, Users, ChevronRight, User, Gavel, AlertTriangle,
  Command, Laptop, Wand2, MapPin, Calendar, Share2, Hexagon, BarChart4, Star
} from 'lucide-react';

/* ========================================================================
   1. CONSTANTS & MOCK DATA
   ======================================================================== */

const USER_PROFILE = {
  id: 999, name: "Felix", role: "Product Designer", location: "Tokyo, Japan", joined: "2024", level: "42",
  skills: ['Figma', 'React', 'Design Systems'], capacity: '40%', reliability: 99, completedJobs: 42
};

const JOBS_DATA = [
  { id: 1, type: 'job', title: "Mobile App Design System", client: "Neo-Digital Inc.", totalPoints: 300000, aiScore: 98, matchReason: "85% skill overlap. Optimal budget.", acceptanceCriteria: ["Definitive Figma Library", "Dark Mode Tokens", "Atomic Design Compliance"] },
  { id: 2, type: 'job', title: "AI Chatbot UI Kit", client: "Future Labs", totalPoints: 150000, aiScore: 94, matchReason: "High efficiency potential.", acceptanceCriteria: ["WCAG 2.1 Compliance", "12 Screen Layouts", "Motion JSON"] }
];

const TALENTS_DATA = [
  { id: 101, type: 'talent', name: "Sarah K.", role: "Senior React Architect", rate: 85000, aiScore: 99, matchReason: "Direct experience with Fintech dashboards similar to your requirements. 5-star rating on last 3 contracts.", location: "Berlin, Germany", joined: "2023", level: "58", totalPoints: 425000, acceptanceCriteria: ["React Native Codebase", "Stripe Integration", "Biometric Auth Flow"] },
  { id: 102, type: 'talent', name: "David L.", role: "Lead Motion Designer", rate: 72000, aiScore: 92, matchReason: "Portfolio includes award-winning interaction designs for banking apps. High velocity output.", location: "Toronto, Canada", joined: "2022", level: "45", totalPoints: 216000, acceptanceCriteria: ["Lottie Animations", "Micro-interactions", "60fps Performance"] }
];

const TRANSACTIONS_DATA = [
  { id: 'TX-991', title: 'Logo Animation', type: 'in', points: 45000, date: '2026.02.05' },
  { id: 'TX-988', title: 'UI Audit Service', type: 'in', points: 120000, date: '2026.01.28' },
  { id: 'TX-982', title: 'Network Fee', type: 'out', points: 5000, date: '2026.01.20' }
];

const STEPS_DATA = [ { id: 1, label: 'PROTOCOL' }, { id: 2, label: 'ESCROW' }, { id: 3, label: 'INSPECT' }, { id: 4, label: 'RATING' } ];

/* ========================================================================
   2. CUSTOM HOOKS
   ======================================================================== */

const useInterval = (callback, delay) => {
  const savedCallback = useRef();
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

/* ========================================================================
   3. UI COMPONENTS (ATOMS & MOLECULES)
   ======================================================================== */

const NeuralBackground = React.memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse mix-blend-screen" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-900/10 rounded-full blur-[120px] mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
  </div>
));

// SpotlightCard moved to components/ui/SpotlightCard.jsx
import SpotlightCard from './components/ui/SpotlightCard';

// HoldButton moved to components/ui/HoldButton.jsx
import HoldButton from './components/ui/HoldButton';

const ScrambleText = ({ text, className, trigger }) => {
  const [display, setDisplay] = useState(text);
  const [iteration, setIteration] = useState(0);

  useEffect(() => { setIteration(0); }, [text, trigger]);

  useInterval(() => {
    const textStr = String(text);
    if (iteration >= textStr.length) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    setDisplay(textStr.split('').map((char, index) => index < iteration ? textStr[index] : chars[Math.floor(Math.random() * chars.length)]).join(''));
    setIteration(prev => prev + 1/3);
  }, iteration < String(text).length ? 30 : null);

  return <span className={className}>{display}</span>;
};

const Typewriter = ({ text = "", delay = 30 }) => {
  const [currentText, setCurrentText] = useState('');
  const [index, setIndex] = useState(0);
  useEffect(() => { setCurrentText(''); setIndex(0); }, [text]);
  useInterval(() => { if (text && index < text.length) { setCurrentText((prev) => prev + text.charAt(index)); setIndex(prev => prev + 1); } }, (text && index < text.length) ? delay : null);
  return <span>{currentText}</span>;
};

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

const AnalyticsGraph = React.memo(() => {
    const data = [20, 45, 30, 60, 55, 85, 70];
    const width = 100;
    const height = 40;
    const max = Math.max(...data);
    const d = useMemo(() => {
        const points = data.map((val, i) => { const x = (i / (data.length - 1)) * width; const y = height - (val / max) * height; return {x, y}; });
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) { const cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 2; const cp1y = points[i-1].y; const cp2x = points[i-1].x + (points[i].x - points[i-1].x) / 2; const cp2y = points[i].y; path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`; }
        return { path, points };
    }, []);

    return (
        <div className="w-full h-32 relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs><linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" /><stop offset="100%" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
                <path d={`${d.path} L ${width},${height} L 0,${height} Z`} fill="url(#graphGradient)" className="opacity-50 transition-all duration-500 group-hover:opacity-70" />
                <path d={d.path} fill="none" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                {d.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#fff" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />)}
            </svg>
        </div>
    );
});

const MatchCircle = ({ score }) => (
    <div className="w-32 h-32 flex flex-col items-center justify-center relative"><div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" /><svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90"><circle cx="60" cy="60" r="50" fill="none" stroke="#1E293B" strokeWidth="6" /><circle cx="60" cy="60" r="50" fill="none" stroke="url(#indigoGradient)" strokeWidth="6" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={(2 * Math.PI * 50) * (1 - score / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" /><defs><linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs></svg><div className="relative z-10 text-center"><span className="text-4xl font-black italic text-white leading-none tracking-tighter"><ScrambleText text={`${score}%`} /></span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Match</span></div></div>
);

/* ========================================================================
   4. FEATURE MODALS
   ======================================================================== */

const ProfileModal = ({ isOpen, onClose, profile, actionLabel, onAction, addToast }) => {
  if (!isOpen || !profile) return null;
  const handleExport = () => addToast('Export Successful', 'Trust Passport downloaded as PDF.');
  const handleAction = () => { if (onAction) { onAction(); onClose(); } };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-lg" onClick={onClose} /><div className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[48px] shadow-2xl overflow-hidden animate-scale-up flex flex-col md:flex-row"><div className="md:w-1/3 bg-white/[0.02] p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center text-center relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" /><div className="relative z-10 w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-emerald-500 mb-6 pointer-events-none"><div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden"><User className="w-16 h-16 text-slate-300" /></div><div className="absolute bottom-1 right-1 w-8 h-8 bg-[#0f172a] rounded-full border border-white/10 flex items-center justify-center text-emerald-400"><BadgeCheck className="w-5 h-5" /></div></div><h2 className="text-3xl font-black text-white mb-1 relative z-10 pointer-events-none">{profile.name}</h2><p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-6 relative z-10 pointer-events-none">{profile.role || "Elite Node"}</p><div className="space-y-4 w-full relative z-10 pointer-events-none"><div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><MapPin className="w-4 h-4 text-indigo-500" /> {profile.location || "Tokyo, Japan"}</div><div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><Calendar className="w-4 h-4 text-indigo-500" /> Member since {profile.joined || "2024"}</div><div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 p-3 rounded-xl"><Hexagon className="w-4 h-4 text-indigo-500" /> Level {profile.level || "42"} Architect</div></div><button onClick={(e) => { e.stopPropagation(); actionLabel ? handleAction() : handleExport(); }} className={`mt-auto w-full py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors relative z-20 ${actionLabel ? 'bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl mb-2 shadow-lg' : 'text-slate-500 hover:text-white'}`}>{actionLabel ? <>Initiate Contract <ArrowRight className="w-4 h-4" /></> : <><Share2 className="w-4 h-4" /> Export Identity</>}</button></div><div className="flex-1 p-8 md:p-12 space-y-10 relative"><div className="flex justify-between items-center relative z-10"><h3 className="text-xl font-black text-white flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-500" /> Performance Metrics</h3><span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">Top 1% Global</span></div><div className="grid grid-cols-2 gap-4 relative z-10">{['Reliability', 'Speed', 'Quality', 'Communication'].map((stat, i) => (<div key={stat} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5"><div className="flex justify-between text-xs text-slate-400 font-bold mb-2"><span>{stat}</span><span className="text-indigo-400">9{i+5}%</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `9${i+5}%` }} /></div></div>))}</div><div className="relative z-10"><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Reputation Heatmap</h4><div className="flex gap-1 h-12">{[...Array(30)].map((_, i) => (<div key={i} className={`flex-1 rounded-sm ${Math.random() > 0.5 ? 'bg-indigo-500/80' : Math.random() > 0.5 ? 'bg-indigo-500/40' : 'bg-white/5'}`} style={{ opacity: Math.random() * 0.5 + 0.5 }} />))}</div></div><div className="p-6 bg-indigo-900/20 border border-indigo-500/20 rounded-3xl flex items-center gap-4 relative z-10"><div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30"><ShieldCheck className="w-6 h-6" /></div><div><h4 className="text-white font-bold">TrustFlow Guarantee</h4><p className="text-xs text-indigo-300">Identity verified via decentralized ledger.</p></div><div className="ml-auto text-2xl font-black text-white italic">100%</div></div></div><button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-50"><X className="w-5 h-5" /></button></div></div>
  );
};

const CommandPalette = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const filteredCommands = useMemo(() => commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase())), [commands, query]);
  useEffect(() => { if (isOpen) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setActiveIndex(0); } }, [isOpen]);
  return !isOpen ? null : (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] px-4"><div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={onClose} /><div className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"><div className="flex items-center gap-3 px-4 py-4 border-b border-white/5"><Search className="w-5 h-5 text-slate-500" /><input ref={inputRef} type="text" placeholder="Type a command..." value={query} onChange={e => { setQuery(e.target.value); setActiveIndex(0); }} className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-base" /><span className="text-[10px] font-mono text-slate-500 border border-white/10 px-1.5 py-0.5 rounded">ESC</span></div><div className="py-2 max-h-[300px] overflow-y-auto">{filteredCommands.length === 0 ? <div className="px-4 py-8 text-center text-slate-500 text-sm">No commands found.</div> : filteredCommands.map((cmd, idx) => (<button key={cmd.id} onClick={() => { cmd.action(); onClose(); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${idx === activeIndex ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : 'hover:bg-white/5 border-l-2 border-transparent'}`} onMouseEnter={() => setActiveIndex(idx)}><div className={`p-2 rounded-lg ${idx === activeIndex ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>{React.createElement(cmd.icon, { size: 16 })}</div><span className={`text-sm ${idx === activeIndex ? 'text-white font-bold' : 'text-slate-300'}`}>{cmd.label}</span>{idx === activeIndex && <ArrowRight className="ml-auto w-4 h-4 text-indigo-400" />}</button>))}</div><div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono"><span>TrustFlow Command Line</span><span>v3.5</span></div></div></div>
  );
};

const DisputeModal = ({ isOpen, onClose, onResolve }) => {
  const [step, setStep] = useState(1);
  useEffect(() => { if(isOpen) setStep(1); }, [isOpen]);
  return !isOpen ? null : (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-rose-950/20 backdrop-blur-lg" onClick={onClose} /><div className="relative bg-[#0f172a] border border-rose-500/30 w-full max-w-lg rounded-[40px] p-8 shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden animate-scale-up">{step === 1 && (<div className="space-y-6"><div className="flex items-center gap-3 text-rose-500 mb-2"><AlertTriangle className="w-8 h-8" /><h3 className="text-2xl font-black italic">Reject Deliverable</h3></div><p className="text-slate-400 text-sm">Initiating arbitration protocol...</p><div className="space-y-3">{['Incomplete Feature Set', 'Quality Below Threshold'].map(r => (<button key={r} onClick={() => { setStep(2); setTimeout(() => setStep(3), 2000); }} className="w-full text-left p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all font-bold text-sm flex justify-between group">{r} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></button>))}</div></div>)}{step === 2 && (<div className="flex flex-col items-center justify-center py-10 space-y-6 text-center"><div className="w-20 h-20 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /><div><h3 className="text-xl font-black text-rose-500 mb-2">AI Arbitrator Analyzing</h3><p className="text-xs text-slate-500 tracking-widest uppercase animate-pulse">Comparing Codebase vs. Spec...</p></div></div>)}{step === 3 && (<div className="space-y-6"><div className="flex items-center gap-3 text-indigo-400 mb-2"><Scale className="w-8 h-8" /><h3 className="text-2xl font-black italic">Fair Resolution</h3></div><div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"><p className="text-sm text-indigo-200 font-bold mb-2">Analysis Result:</p><p className="text-xs text-slate-400 leading-relaxed">Recommendation: <span className="text-white font-bold">24h extension</span>.</p></div><div className="flex gap-3"><button onClick={onResolve} className="flex-1 py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-indigo-50 transition-all">Accept 24h Extension</button></div></div>)}</div></div>
  );
};

const PaymentModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-scale-up overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" /><div className="flex justify-between items-center mb-8 relative z-10"><h3 className="text-2xl font-black text-white italic tracking-tighter">Add Funds</h3><button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div><div className="space-y-6 relative z-10"><div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group"><div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" /><div className="relative z-10"><div className="flex justify-between items-start mb-8"><CreditCard className="w-8 h-8 opacity-80" /><span className="font-mono text-lg opacity-80">•••• 4242</span></div><div><p className="text-[10px] uppercase opacity-60 tracking-widest mb-1">Balance</p><p className="text-2xl font-black tracking-widest">$12,450.00</p></div></div></div><div className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Amount (USD)</label><div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"><span className="text-slate-400 font-bold">$</span><input type="number" defaultValue="1000" className="bg-transparent border-none outline-none text-white font-mono text-xl flex-1" /></div></div></div><HoldButton onClick={onConfirm} label="Confirm Deposit" icon={ArrowRight} className="w-full py-5 rounded-2xl shadow-xl" color="white" /></div></div></div>
  );
};

const BiometricModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [scanStatus, setScanStatus] = useState('idle');
  useEffect(() => { if (isOpen) setScanStatus('idle'); }, [isOpen]);
  const handleScan = () => { setScanStatus('scanning'); setTimeout(() => { setScanStatus('success'); setTimeout(onAuthenticated, 800); }, 2000); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={onClose} /><div className="relative flex flex-col items-center"><div className={`w-32 h-32 rounded-[32px] border-2 flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group ${scanStatus === 'success' ? 'border-emerald-500 bg-emerald-500/10' : scanStatus === 'scanning' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 bg-white/5 hover:border-indigo-400'}`} onClick={scanStatus === 'idle' ? handleScan : undefined}>{scanStatus === 'scanning' && (<div className="absolute inset-0 bg-indigo-500/20 animate-scan-vertical" />)}{scanStatus === 'success' ? (<CheckCircle2 className="w-16 h-16 text-emerald-500 animate-scale-up" />) : (<Fingerprint className={`w-16 h-16 transition-colors ${scanStatus === 'scanning' ? 'text-indigo-400 animate-pulse' : 'text-slate-500 group-hover:text-indigo-400'}`} />)}</div><p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">{scanStatus === 'idle' ? 'Touch to Authorize' : scanStatus === 'scanning' ? 'Verifying Biometrics...' : 'Identity Confirmed'}</p></div></div>
  );
};

// --- Page Views ---

const MarketplaceView = ({ mode, jobs, talents, onSelect, projectPrompt, setProjectPrompt, handleAIArchitectSubmit, aiSuggestions, scrambleTrigger }) => (
    <div className="space-y-16 animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="shrink-0 relative group"><div className="w-32 h-32 relative flex items-center justify-center"><div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40px] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700" /><div className="w-full h-full bg-[#0a0f1e] border border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden backdrop-blur-3xl"><div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent blur-[0.5px] animate-scan shadow-[0_0_8px_rgba(255,255,255,0.8)]" /><BrainCircuit className="text-indigo-400 w-16 h-16 relative z-10 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)] animate-pulse" /></div></div><div className="absolute -bottom-2 -right-2 z-20"><div className="w-12 h-12 bg-[#050b14] rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400 backdrop-blur-md"><ShieldCheck className="w-6 h-6" /></div></div></div>
            <div className="flex-1 space-y-4 text-center md:text-left"><h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white leading-[0.9]"><Typewriter text={mode === 'earner' ? "Ready to earn, Felix?" : "Build your team, Felix."} /></h1><p className="text-slate-400 text-lg">AI has curated <span className="text-indigo-400 font-bold">2 prime vectors</span> based on your profile.</p></div>
        </div>
        {mode === 'earner' ? (
            <div className="grid grid-cols-1 gap-8">
                {jobs.map(item => (
                    <SpotlightCard key={item.id} className="rounded-[40px] p-8 cursor-pointer group" onClick={() => onSelect(item)}>
                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full">
                            <div className="shrink-0"><MatchCircle score={item.aiScore} /></div>
                            <div className="flex-1 space-y-6 text-center md:text-left min-w-0">
                                <div><h3 className="text-3xl font-black text-white mb-2">{item.title}</h3><p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{item.client}</p></div>
                                <div className="relative pl-6 border-l-2 border-indigo-500/30"><p className="text-sm sm:text-lg font-medium leading-relaxed text-slate-300 italic">"{item.matchReason}"</p></div>
                                <div className="flex flex-wrap gap-8 justify-center md:justify-start pt-2"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reward</p><p className="text-2xl font-black italic text-white leading-none tracking-tight"><ScrambleText text={item.totalPoints.toLocaleString()} trigger={scrambleTrigger} /> <span className="text-xs not-italic text-slate-500 font-bold">PTS</span></p></div></div>
                            </div>
                            <div className="shrink-0 w-full md:w-auto mt-6 md:mt-0 md:ml-auto"><button className="w-full md:w-auto bg-white text-[#020617] px-10 py-5 rounded-[24px] font-black text-lg hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">Initialize <ArrowRight className="w-5 h-5" /></button></div>
                        </div>
                    </SpotlightCard>
                ))}
            </div>
        ) : (
            <div className="space-y-16 animate-fade-in-up">
                {!aiSuggestions ? (
                    <div className="max-w-3xl mx-auto text-center space-y-10">
                        <div className="w-20 h-20 bg-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]"><BrainCircuit className="w-10 h-10 text-emerald-400" /></div>
                        <div><h1 className="text-5xl font-black text-white tracking-tighter mb-4">AI Project Architect</h1><p className="text-slate-400 text-lg">Describe what you need. I'll define the scope, budget, and find the perfect talent.</p></div>
                        <div className="relative"><textarea value={projectPrompt} onChange={(e) => setProjectPrompt(e.target.value)} placeholder="e.g., I need a React Native developer..." className="w-full bg-[#0f172a] border border-white/10 rounded-[32px] p-8 text-lg text-white outline-none focus:border-emerald-500/50 transition-all min-h-[200px] resize-none shadow-2xl" /><div className="absolute bottom-6 right-6"><button onClick={handleAIArchitectSubmit} disabled={!projectPrompt && projectPrompt !== ''} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"><Sparkles className="w-4 h-4" /> Architect Project</button></div></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="bg-[#0f172a] border border-white/10 rounded-[48px] p-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
                            <div className="flex items-start gap-6 mb-8"><div className="p-3 bg-emerald-500/10 rounded-xl"><FileSignature className="w-6 h-6 text-emerald-400" /></div><div><h2 className="text-2xl font-black text-white mb-2">Project Scope Defined</h2><p className="text-slate-400">{aiSuggestions.summary}</p></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Generated DoD</h4><ul className="space-y-3">{aiSuggestions.dod.map((item, i) => (<li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}</li>))}</ul></div>
                                <div className="bg-white/5 rounded-3xl p-6"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recommended Budget</h4><p className="text-3xl font-black text-white">{aiSuggestions.budget}</p></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {aiSuggestions.candidates.map(talent => (
                                <SpotlightCard key={talent.id} className="rounded-[32px] p-8 cursor-pointer group" onClick={() => onSelect(talent)}>
                                    <div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-white">{talent.name[0]}</div><div><h4 className="font-bold text-white text-lg">{talent.name}</h4><p className="text-xs text-slate-400 uppercase tracking-wider">{talent.role}</p></div></div><div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black">{talent.aiScore}% Match</div></div>
                                    <p className="text-sm text-slate-300 mb-6 italic border-l-2 border-indigo-500/30 pl-4 py-1">"{talent.matchReason}"</p>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-4"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Est. Rate</p><p className="text-white font-mono font-bold text-lg">{talent.rate.toLocaleString()} <span className="text-slate-500 text-xs">PTS / day</span></p></div><button className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors">Hire</button></div>
                                </SpotlightCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
);

const ScopingView = ({ selectedItem, onBack, onInitiate, scrambleTrigger }) => (
    <div className="space-y-12 animate-fade-in-up">
        <button onClick={onBack} className="flex items-center gap-3 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] group pl-2"><ArrowLeft className="w-3 h-3" /> Abort Sequence</button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-[#0f172a]/60 rounded-[48px] p-10 sm:p-14 border border-white/5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20"><ListChecks className="w-6 h-6 text-indigo-400" /></div><div><h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic text-white leading-none">Acceptance Protocol</h1><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Definition of Done (DoD)</p></div></div>
                <div className="space-y-4">{selectedItem.acceptanceCriteria.map((c, i) => (<div key={i} className="flex items-start gap-5 p-5 bg-white/[0.02] rounded-[24px] border border-white/5 hover:bg-white/[0.04] transition-all"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /><p className="font-bold text-slate-300 text-sm leading-relaxed">{c}</p></div>))}</div>
            </div>
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0f172a]/80 rounded-[48px] p-10 border border-white/10 shadow-2xl sticky top-32 backdrop-blur-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Contract Value</p>
                    <h2 className="text-5xl font-black italic text-white mb-10 leading-none tracking-tighter"><ScrambleText text={selectedItem.totalPoints.toLocaleString()} trigger={scrambleTrigger} /> <span className="text-sm not-italic text-slate-500 block mt-2 uppercase tracking-widest font-bold">TrustPoints</span></h2>
                    <button onClick={onInitiate} className="w-full bg-white text-[#020617] py-6 rounded-[24px] font-black text-lg hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"><Fingerprint className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" /> Sign & Fund</button>
                </div>
            </div>
        </div>
    </div>
);

const ContractView = ({ step, handleNextStep, handleReject, isUploading, uploadProgress, handleFileUpload, status }) => {
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
                    <div className="space-y-6 mt-8">{TRANSACTIONS_DATA.map(tx => (<div key={tx.id} className="flex items-center justify-between p-8 bg-white/[0.02] rounded-[36px] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer"><div className="flex items-center gap-8"><div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}><TrendingUp className={`w-8 h-8 ${tx.type === 'out' ? 'rotate-180' : ''}`} /></div><div><p className="font-black text-white text-xl tracking-tight group-hover:text-indigo-300 transition-colors">{tx.title}</p><p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2">{tx.id} • {tx.date}</p></div></div><div className="text-right"><p className={`text-3xl font-black italic tracking-tight ${tx.type === 'in' ? 'text-emerald-500' : 'text-slate-300'}`}>{tx.type === 'in' ? '+' : '-'}{tx.points.toLocaleString()}</p><span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none">PTS</span></div></div>))}</div>
                </div>
            </div>
        </div>
    </div>
);

// --- Main App Component ---

const App = () => {
  const [mode, setMode] = useState('earner');
  const [view, setView] = useState('marketplace');
  const [step, setStep] = useState(1);
  const [userPoints, setUserPoints] = useState(500000);
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState('idle');
  const lastActionTime = useRef(0); // Safety guard for global transitions

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scrambleTrigger, setScrambleTrigger] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: 'Protocol initialized. DoD generated based on risk profile.', time: '10:00', type: 'text' }, { id: 2, sender: 'client', text: 'Looking forward to the design system!', time: '10:05', type: 'text' }]);
  const [inputText, setInputText] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);

  // Confetti Trigger separate from step logic to ensure it fires
  useEffect(() => {
     if (step === 5) {
         setShowConfetti(true);
         const timer = setTimeout(() => setShowConfetti(false), 5000);
         return () => clearTimeout(timer);
     }
  }, [step]);

  const addToast = useCallback((title, message, type = 'info') => { const id = Date.now(); setToasts(prev => [...prev, { id, title, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000); }, []);

  const toggleMode = () => {
    if (status !== 'idle') return;
    setStatus('switching');
    setTimeout(() => {
        setMode(prev => { const newMode = prev === 'earner' ? 'hirer' : 'earner'; setView('marketplace'); return newMode; });
        setSelectedItem(null);
        setAiSuggestions(null);
        setProjectPrompt('');
        setStatus('idle');
        addToast('Mode Switched', `Active Interface: ${mode === 'earner' ? 'Client (Hirer)' : 'Professional (Earner)'}`);
    }, 800);
  };

  const handleSelect = (item) => { setSelectedItem(item); setIsProfileOpen(false); setView('scoping'); };
  const handleViewProfile = (data) => { setProfileData(data); setIsProfileOpen(true); };
  const handleAIArchitectSubmit = () => { setStatus('processing'); setTimeout(() => { setAiSuggestions({ summary: "Based on your request, I've architected a project scope.", dod: ["React Native Codebase", "Stripe Integration", "Biometric Auth Flow"], budget: "250,000 - 300,000 PTS", candidates: TALENTS_DATA }); setStatus('idle'); }, 1500); };
  const initiateContract = () => setIsBiometricOpen(true);
  const handleBiometricSuccess = () => { setIsBiometricOpen(false); setView('contract'); setStep(1); addToast('Identity Verified', 'Biometric signature applied to contract.', 'success'); };

  const handleNextStep = useCallback(() => {
    const now = Date.now();
    // Strong guard: Prevent double execution within 1.5 seconds or if already processing
    if (status === 'processing' || now - lastActionTime.current < 1500) return;

    lastActionTime.current = now;
    setStatus('processing');

    setTimeout(() => {
      // Logic execution
      if (step === 2) { if (mode === 'hirer') setUserPoints(p => p - selectedItem.totalPoints); else setUserPoints(p => p + selectedItem.totalPoints); }

      // Navigation
      if (step === 5) {
          // Reset everything for next cycle
          setView('marketplace');
          setSelectedItem(null);
          setStep(1);
          setIsUploading(false);
          setUploadProgress(0);
          setStatus('idle');
          return;
      }

      setStep(prev => prev + 1);
      setStatus('idle');
    }, 1200);
  }, [step, mode, selectedItem, status]);

  const handleReject = () => { setIsDisputeOpen(true); };
  const handleDisputeResolve = () => { setIsDisputeOpen(false); addToast('Dispute Resolved', 'Extension time added to contract.', 'success'); };

  const handleFileUpload = () => {
      if (isUploading) return;
      setIsUploading(true);
      let progress = 0;
      const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(progress);
          if (progress >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              setUploadProgress(0);
              // Directly call handleNextStep logic here to avoid race conditions with button state
              setStatus('processing');
              setTimeout(() => {
                  setStep(prev => prev + 1);
                  setStatus('idle');
                  addToast('Upload Complete', 'AI Inspection initiated.');
              }, 1200);
          }
      }, 80);
  };
  const handleDeposit = () => { setIsPaymentModalOpen(false); setStatus('processing'); setTimeout(() => { setUserPoints(prev => prev + 100000); setStatus('idle'); addToast('Deposit Successful', '100,000 PTS added to Vault.', 'success'); }, 1000); };

  const triggerSmartContractUpdate = () => { const userMsg = { id: Date.now(), sender: 'me', text: 'Additional requirements for dark mode have come up. Can we increase the budget?', time: 'Now', type: 'text' }; setMessages(prev => [...prev, userMsg]); setTimeout(() => { const aiProposal = { id: Date.now() + 1, sender: 'ai', type: 'contract_update', data: { title: 'Scope Expansion Detected', changes: ['Add: Dark Mode Variants (+12 Screens)', 'Timeline: +2 Days'], additionalCost: 50000, newTotal: selectedItem ? selectedItem.totalPoints + 50000 : 50000 }, time: 'Now' }; setMessages(prev => [...prev, aiProposal]); }, 1500); };
  const acceptContractUpdate = (updateData) => { if (selectedItem) { setSelectedItem(prev => ({ ...prev, totalPoints: updateData.newTotal, acceptanceCriteria: [...prev.acceptanceCriteria, "Dark Mode Variants Completed"] })); } setScrambleTrigger(prev => prev + 1); setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `Contract updated. Budget increased by ${updateData.additionalCost.toLocaleString()} PTS.`, time: 'Now', type: 'text' }]); addToast('Smart Contract Updated', 'New budget locked in escrow.', 'success'); };
  const handleSendMessage = () => { if (!inputText.trim()) return; setMessages([...messages, { id: Date.now(), sender: 'me', text: inputText, time: 'Now', type: 'text' }]); setInputText(''); setTimeout(() => { setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: 'Context updated. Evidence logged.', time: 'Now', type: 'text' }]); }, 1000); };
  useEffect(() => { if (isChatOpen && chatEndRef.current) { chatEndRef.current.scrollIntoView({ behavior: "smooth" }); } }, [messages, isChatOpen]);

  const commands = useMemo(() => [
      { id: 'home', label: 'Go to Marketplace', icon: LayoutGrid, action: () => setView('marketplace') },
      { id: 'wallet', label: 'Open Wallet', icon: Wallet, action: () => setView('wallet') },
      { id: 'profile', label: 'View Trust Passport', icon: User, action: () => handleViewProfile(USER_PROFILE) },
      { id: 'switch', label: `Switch to ${mode === 'earner' ? 'Hirer' : 'Earner'} Mode`, icon: RefreshCw, action: toggleMode },
      { id: 'chat', label: 'Toggle Chat', icon: MessageSquare, action: () => setIsChatOpen(prev => !prev) },
  ], [mode]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <NeuralBackground />
      {showConfetti && (<div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex justify-center">{[...Array(20)].map((_, i) => (<div key={i} className="absolute top-0 w-2 h-2 bg-emerald-400 rounded-full animate-fall" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 3}s` }} />))}</div>)}
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleDeposit} />
      <BiometricModal isOpen={isBiometricOpen} onClose={() => setIsBiometricOpen(false)} onAuthenticated={handleBiometricSuccess} />
      <DisputeModal isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} onResolve={handleDisputeResolve} />
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} commands={commands} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={profileData} addToast={addToast} actionLabel={profileData?.id !== USER_PROFILE.id ? "Initiate Contract" : null} onAction={profileData?.id !== USER_PROFILE.id ? () => handleSelect(profileData) : null} />

      {(status === 'processing' || status === 'switching') && (<div className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center"><Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" /><p className="text-indigo-400 font-black tracking-[0.5em] text-[10px] uppercase animate-pulse">{status === 'switching' ? 'Reconfiguring Interface...' : 'Verifying Ledger...'}</p></div>)}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('marketplace')}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${mode === 'earner' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{mode === 'earner' ? <ShieldCheck className="text-white w-6 h-6" /> : <Briefcase className="text-white w-6 h-6" />}</div>
          <div className="hidden sm:block"><span className="font-black text-xl tracking-tighter text-white block leading-none">TRUSTFLOW</span><span className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">{mode === 'earner' ? 'Professional' : 'Client Suite'}</span></div>
        </div>
        <div onClick={() => setIsCommandOpen(true)} className="hidden md:flex flex-1 max-w-md mx-6 items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-4 py-2.5 rounded-xl cursor-pointer transition-all group"><Search className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" /><span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Type a command...</span><div className="ml-auto flex gap-1"><span className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">⌘K</span></div></div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleMode} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all"><div className={`w-2 h-2 rounded-full ${mode === 'earner' ? 'bg-indigo-500' : 'bg-emerald-500'}`} /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">Switch to {mode === 'earner' ? 'Hire' : 'Work'}</span><RefreshCw className="w-3 h-3 text-slate-500" /></button>
          <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setView('wallet')}><Coins className="w-3.5 h-3.5 text-amber-500" /><span className="font-mono font-bold text-xs">{userPoints.toLocaleString()}</span></div>
          <div className="flex items-center gap-3 pl-2 border-l border-white/10"><button className="relative p-2 hover:bg-white/5 rounded-full transition-colors group"><Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" /><span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#020617]" /></button><div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px] cursor-pointer hover:scale-105 transition-transform" onClick={() => handleViewProfile(USER_PROFILE)}><div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden"><User className="w-5 h-5 text-slate-300" /></div></div></div>
        </div>
      </nav>

      <main className="pt-32 pb-32 max-w-6xl mx-auto px-6 relative z-10">
        {view === 'marketplace' && <MarketplaceView mode={mode} jobs={JOBS_DATA} talents={TALENTS_DATA} onSelect={mode === 'earner' ? handleSelect : handleViewProfile} projectPrompt={projectPrompt} setProjectPrompt={setProjectPrompt} handleAIArchitectSubmit={handleAIArchitectSubmit} aiSuggestions={aiSuggestions} scrambleTrigger={scrambleTrigger} />}
        {view === 'scoping' && selectedItem && <ScopingView selectedItem={selectedItem} onBack={() => setView('marketplace')} onInitiate={initiateContract} scrambleTrigger={scrambleTrigger} />}
        {view === 'contract' && selectedItem && <ContractView step={step} handleNextStep={handleNextStep} handleReject={handleReject} isUploading={isUploading} uploadProgress={uploadProgress} handleFileUpload={handleFileUpload} status={status} />}
        {view === 'wallet' && <WalletView onBack={() => setView('marketplace')} isFlipped={isFlipped} setIsFlipped={setIsFlipped} userPoints={userPoints} transactions={TRANSACTIONS_DATA} onDeposit={handleDeposit} setIsPaymentModalOpen={setIsPaymentModalOpen} />}
      </main>

      {/* Floating Chat Overlay */}
      <div className="fixed bottom-24 sm:bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        {isChatOpen && (
            <div className="w-80 sm:w-96 h-[500px] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-white" /></div><div><p className="font-black text-white text-sm">Context Chat</p><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</p></div></div><button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            {msg.type === 'contract_update' ? (
                                <div className="max-w-[90%] w-full bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-[24px] rounded-bl-none"><div className="flex items-center gap-2 mb-3 text-indigo-300"><FileSignature className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Smart Contract Proposal</span></div><h4 className="font-bold text-white mb-2">{msg.data.title}</h4><ul className="space-y-1 mb-4">{msg.data.changes.map((change, i) => (<li key={i} className="text-xs text-slate-300 flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> {change}</li>))}</ul><div className="flex justify-between items-end mb-4 pt-3 border-t border-white/10"><span className="text-[10px] font-bold text-slate-500 uppercase">Cost Impact</span><span className="text-lg font-black text-white">+{msg.data.additionalCost.toLocaleString()} PTS</span></div><div className="flex gap-2"><button className="flex-1 py-2 bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Reject</button><button onClick={() => acceptContractUpdate(msg.data)} className="flex-1 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500">Accept Update</button></div></div>
                            ) : (<div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-none' : msg.sender === 'ai' ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-200 rounded-bl-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>{msg.sender === 'ai' && <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI System Log</p>}{msg.text}<p className="text-[9px] opacity-50 mt-2 text-right">{msg.time}</p></div>)}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-white/5 bg-[#020617]/50"><button onClick={triggerSmartContractUpdate} className="text-[10px] text-slate-500 hover:text-indigo-400 mb-2 w-full text-center uppercase tracking-widest font-bold opacity-50 hover:opacity-100 transition-opacity">[Dev: Simulate Scope Creep]</button><div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-slate-500" /><button onClick={handleSendMessage} className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500"><Send className="w-4 h-4" /></button></div></div>
            </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-110 transition-transform active:scale-95"><MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" /></button>
      </div>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/10 px-8 py-5 flex justify-between items-center z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
        <button className={`p-3 transition-all duration-300 ${view === 'marketplace' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setView('marketplace')}><LayoutGrid className="w-6 h-6" /></button>
        <button className="p-3 text-slate-500" onClick={() => setIsCommandOpen(true)}><Search className="w-6 h-6" /></button>
        <button className={`p-3 transition-all duration-300 ${view === 'wallet' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setView('wallet')}><Wallet className="w-6 h-6" /></button>
        <button className="p-3 text-slate-500"><UserCheck className="w-6 h-6" /></button>
      </nav>

      <style>{`
        body { background-color: #020617; margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fall { to { transform: translateY(100vh) rotate(720deg); } }
        .animate-fall { animation: fall linear forwards; }
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan { animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes scanVertical { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan-vertical { animation: scanVertical 1.5s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;