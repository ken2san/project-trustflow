
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ShieldCheck, ArrowRight, Lock, Unlock, CheckCircle2, AlertCircle,
  MessageSquare, Wallet, Coins, PlusCircle, Search, Sparkles, Zap,
  ArrowLeft, ListChecks, Activity, TrendingUp, Globe, Award,
  BadgeCheck, UploadCloud, X, Send, Paperclip, Fingerprint, Scale,
  BrainCircuit, Target, UserCheck, LayoutGrid, Bell, CreditCard,
  Loader2, Check, MousePointer2, FileSignature, Scan, Hash,
  RefreshCw, QrCode, Briefcase, Users, ChevronRight, User, Gavel, AlertTriangle,
  Command, Laptop, Wand2, MapPin, Calendar, Share2, Hexagon, BarChart4, Star,
  Layers
} from 'lucide-react';
// Returns a unified profile object merging static and dynamic user data
// (moved below imports)

// Centralized constants and mock data
import { USER_PROFILE, JOBS_DATA, TALENTS_DATA, TRANSACTIONS_DATA, STEPS_DATA } from './lib/constants';
import { formatNumber } from './lib/utils';


// ...existing code...


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

// NeuralBackground moved to components/ui/NeuralBackground.jsx
import NeuralBackground from './components/ui/NeuralBackground';

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


// ToastContainer moved to components/ui/ToastContainer.jsx
import ToastContainer from './components/ui/ToastContainer';


/* ========================================================================
   4. FEATURE MODALS
   ======================================================================== */


// ProfileModal moved to components/modals/ProfileModal.jsx
import ProfileModal from './components/modals/ProfileModal';

// CommandPalette restored from archive for command modal
import CommandPalette from '../archive/CommandPalette.jsx';




// DisputeModal moved to components/modals/DisputeModal.jsx
import DisputeModal from './components/modals/DisputeModal';


// PaymentModal moved to components/modals/PaymentModal.jsx
import PaymentModal from './components/modals/PaymentModal';



// --- Page Views ---

// MarketplaceView moved to views/MarketplaceView.jsx
import MarketplaceView from './views/MarketplaceView';

// ScopingView moved to views/ScopingView.jsx
import ScopingView from './views/ScopingView';

// ContractView moved to views/ContractView.jsx
import ContractView from './views/ContractView';

// WalletView moved to views/WalletView.jsx
import WalletView from './views/WalletView';

// CommandCenterView moved to views/CommandCenterView.jsx
import CommandCenterView from './views/CommandCenterView';

// ProjectDetailView moved to views/ProjectDetailView.jsx
import ProjectDetailView from './views/ProjectDetailView';

// --- Main App Component ---

const App = () => {
  // Animation state for level/parameter up
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showParamUp, setShowParamUp] = useState(false);

  // Animation triggers
  const triggerLevelUp = useCallback(() => {
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 1800);
  }, []);
  const triggerParamUp = useCallback(() => {
    setShowParamUp(true);
    setTimeout(() => setShowParamUp(false), 1200);
  }, []);

  const [mode, setMode] = useState('earner');
  const [view, setView] = useState('marketplace');
  const [step, setStep] = useState(1);
  const [userPoints, setUserPoints] = useState(500000);
  // User parameter system (userStats)
  const [userStats, setUserStats] = useState({
    completedContracts: 0,
    disputesResolved: 0,
    trustScore: 80,
    totalEarned: 0,
    totalSpent: 0,
    badges: [],
    exp: 0,
    level: 1,
    avgRating: 0,
    recentHistory: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState('idle');
  // Add projectDetail state for Project Detail & Negotiation flow
  const [projectDetail, setProjectDetail] = useState(null);
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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: 'Protocol initialized. DoD generated based on risk profile.', time: '10:00', type: 'text' }, { id: 2, sender: 'client', text: 'Looking forward to the design system!', time: '10:05', type: 'text' }]);
  const [inputText, setInputText] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);



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
  // BiometricModal removed: go directly to contract view
  const initiateContract = () => { setView('contract'); setStep(1); addToast('Contract Initiated', 'Contract flow started.'); };

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
  const acceptContractUpdate = (updateData) => { if (selectedItem) { setSelectedItem(prev => ({ ...prev, totalPoints: updateData.newTotal, acceptanceCriteria: [...prev.acceptanceCriteria, "Dark Mode Variants Completed"] })); } setScrambleTrigger(prev => prev + 1); setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `Contract updated. Budget increased by ${formatNumber(updateData.additionalCost)} PTS.`, time: 'Now', type: 'text' }]); addToast('Smart Contract Updated', 'New budget locked in escrow.', 'success'); };
  const handleSendMessage = () => { if (!inputText.trim()) return; setMessages([...messages, { id: Date.now(), sender: 'me', text: inputText, time: 'Now', type: 'text' }]); setInputText(''); setTimeout(() => { setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: 'Context updated. Evidence logged.', time: 'Now', type: 'text' }]); }, 1000); };
  useEffect(() => { if (isChatOpen && chatEndRef.current) { chatEndRef.current.scrollIntoView({ behavior: "smooth" }); } }, [messages, isChatOpen]);

  const commands = useMemo(() => [
      { id: 'home', label: 'Go to Marketplace', icon: LayoutGrid, action: () => setView('marketplace') },
      { id: 'wallet', label: 'Open Wallet', icon: Wallet, action: () => setView('wallet') },
      { id: 'command-center', label: 'Open Command Center', icon: Layers, action: () => setView('command-center') },
      { id: 'profile', label: 'View Trust Passport', icon: User, action: () => handleViewProfile(USER_PROFILE) },
      { id: 'switch', label: `Switch to ${mode === 'earner' ? 'Hirer' : 'Earner'} Mode`, icon: RefreshCw, action: toggleMode },
      { id: 'chat', label: 'Toggle Chat', icon: MessageSquare, action: () => setIsChatOpen(prev => !prev) },
  ], [mode]);

  // Strategy level (Conservative / Normal / Aggressive)
  const [strategy, setStrategy] = useState('Balanced');


  // Returns a unified profile object merging static and dynamic user data
  const getUnifiedProfile = useCallback(() => {
    return {
      ...USER_PROFILE,
      ...userStats,
    };
  }, [userStats]);

  // Always use unifiedProfile for profile data
  const unifiedProfile = getUnifiedProfile();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <NeuralBackground />

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleDeposit} />
      {/* BiometricModal removed for MVP slimdown */}
      <DisputeModal isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} onResolve={handleDisputeResolve} />
      {isCommandOpen && (
        <>
          {/* Overlay for command palette modal: semi-transparent, blur, background visible */}
          <div className="fixed inset-0 z-[100] bg-[#0a0f1a]/70 backdrop-blur-[6px] transition-opacity" onClick={() => setIsCommandOpen(false)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="w-[540px] max-w-full bg-[#23263a] rounded-[36px] shadow-[0_16px_64px_0_rgba(79,70,229,0.55),0_2px_16px_0_rgba(0,0,0,0.25)] border border-indigo-500/30 p-12 flex flex-col items-center">
              <CommandPalette isOpen={true} onClose={() => setIsCommandOpen(false)} commands={commands} />
            </div>
          </div>
        </>
      )}
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
          <button onClick={toggleMode} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all"><div className={`w-2 h-2 rounded-full ${mode === 'earner' ? 'bg-indigo-500' : 'bg-emerald-500'}`} /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">Switch to {mode === 'earner' ? 'Hire' : 'Work'}</span><RefreshCw className="w-3 h-3 text-slate-500" /></button>
          <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setView('wallet')}><Coins className="w-3.5 h-3.5 text-amber-500" /><span className="font-mono font-bold text-xs">{formatNumber(userPoints)}</span></div>
          {/* Command Center icon (PC/tablet only) */}
          <button
            className={`hidden sm:inline-flex p-2 ml-2 rounded-full border border-white/10 transition-colors ${view === 'command-center' ? 'bg-indigo-500/20 text-indigo-400 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-indigo-300 hover:bg-white/10'}`}
            title="Command Center"
            onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('command-center'); }}
          >
            <Layers className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors group"><Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" /><span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#020617]" /></button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px] cursor-pointer hover:scale-105 transition-transform hidden sm:block" onClick={() => handleViewProfile(USER_PROFILE)}>
              <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden">
                {USER_PROFILE.avatarUrl ? (
                  <img src={USER_PROFILE.avatarUrl} alt={USER_PROFILE.name} className="w-full h-full object-cover" />
                ) : USER_PROFILE.name ? (
                  <span className="w-full h-full flex items-center justify-center text-base font-bold text-indigo-300">{USER_PROFILE.name[0]}</span>
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-32 max-w-6xl mx-auto px-6 relative z-10">
        {view === 'marketplace' && <MarketplaceView mode={mode} jobs={JOBS_DATA} talents={TALENTS_DATA} onViewDetails={item => { setProjectDetail(item); setView('project-detail'); }} projectPrompt={projectPrompt} setProjectPrompt={setProjectPrompt} handleAIArchitectSubmit={handleAIArchitectSubmit} aiSuggestions={aiSuggestions} scrambleTrigger={scrambleTrigger} formatNumber={formatNumber} onHire={talent => { setSelectedItem(talent); setView('contract'); setStep(1); addToast('Contract Initiated', 'Contract flow started.'); }} />}
        {view === 'project-detail' && projectDetail && (
          <ProjectDetailView
            project={projectDetail}
            negotiationHistory={[]}
            onAgreement={() => { setSelectedItem(projectDetail); setView('scoping'); }}
            onBack={() => setView('marketplace')}
          />
        )}
        {view === 'scoping' && selectedItem && <ScopingView selectedItem={selectedItem} onBack={() => setView('project-detail')} onInitiate={initiateContract} scrambleTrigger={scrambleTrigger} formatNumber={formatNumber} />}
        {view === 'contract' && selectedItem && <ContractView step={step} handleNextStep={handleNextStep} handleReject={handleReject} isUploading={isUploading} uploadProgress={uploadProgress} handleFileUpload={handleFileUpload} status={status} formatNumber={formatNumber} userStats={userStats} setUserStats={setUserStats} addToast={addToast} triggerLevelUp={triggerLevelUp} triggerParamUp={triggerParamUp} />}
              {/* Global Level Up/Param Up Animation */}
              {showLevelUp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                  {/* Overlay background */}
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="text-5xl font-black text-emerald-400 drop-shadow-[0_4px_32px_rgba(16,185,129,0.7)] animate-pop-scale mb-4 text-center" style={{textShadow:'0 2px 16px #059669, 0 0 2px #fff'}}>LEVEL UP!</div>
                    <div className="text-xl font-bold text-indigo-200 drop-shadow animate-fade-in-up text-center">
                      New ability unlocked: <span className="text-white">Priority Support</span>
                    </div>
                  </div>
                </div>
              )}
              {showParamUp && !showLevelUp && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                  <div className="text-3xl font-black text-indigo-300 drop-shadow animate-pop-fade">+1 PARAMETER</div>
                </div>
              )}
        {view === 'wallet' && <WalletView onBack={() => setView('marketplace')} isFlipped={isFlipped} setIsFlipped={setIsFlipped} userPoints={userPoints} transactions={TRANSACTIONS_DATA} onDeposit={handleDeposit} setIsPaymentModalOpen={setIsPaymentModalOpen} formatNumber={formatNumber} />}
        {view === 'command-center' && (
          <CommandCenterView
            activeOperations={DUMMY_ACTIVE_OPERATIONS}
            missionLogs={DUMMY_MISSION_LOGS}
            onOperationClick={op => {
              setSelectedItem(op);
              let stepNum = 1;
              if (op.progress >= 100) stepNum = 5;
              else if (op.progress >= 75) stepNum = 4;
              else if (op.progress >= 50) stepNum = 3;
              else if (op.progress >= 25) stepNum = 2;
              setStep(stepNum);
              setView('contract');
            }}
            strategy={strategy}
            onStrategyChange={setStrategy}
            unifiedProfile={unifiedProfile}
            onViewProfile={() => {
              setProfileData(unifiedProfile);
              setIsProfileOpen(true);
            }}
          />
        )}

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
                              <div className="max-w-[90%] w-full bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-[24px] rounded-bl-none"><div className="flex items-center gap-2 mb-3 text-indigo-300"><FileSignature className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Smart Contract Proposal</span></div><h4 className="font-bold text-white mb-2">{msg.data.title}</h4><ul className="space-y-1 mb-4">{msg.data.changes.map((change, i) => (<li key={i} className="text-xs text-slate-300 flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> {change}</li>))}</ul><div className="flex justify-between items-end mb-4 pt-3 border-t border-white/10"><span className="text-[10px] font-bold text-slate-500 uppercase">Cost Impact</span><span className="text-lg font-black text-white">+{formatNumber(msg.data.additionalCost)} PTS</span></div><div className="flex gap-2"><button className="flex-1 py-2 bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Reject</button><button onClick={() => acceptContractUpdate(msg.data)} className="flex-1 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500">Accept Update</button></div></div>
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
        <button className={`p-3 transition-all duration-300 ${view === 'marketplace' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('marketplace'); }}><LayoutGrid className="w-6 h-6" /></button>
        <button className={`p-3 transition-all duration-300 ${view === 'wallet' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('wallet'); }}><Wallet className="w-6 h-6" /></button>
        {/* Command Centerアイコン（Mobileのみ表示） */}
        <button className={`p-3 transition-all duration-300 ${view === 'command-center' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'} inline-flex sm:hidden`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('command-center'); }}><Layers className="w-6 h-6" /></button>
        <button className="p-3 text-slate-500 inline-flex" onClick={() => { setIsCommandOpen(false); setView('marketplace'); setProfileData(unifiedProfile); setIsProfileOpen(true); }}>
          {/* Avatar icon for mobile bottom bar (same as header) */}
          <span className="block w-6 h-6 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-800">
            {USER_PROFILE.avatarUrl ? (
              <img src={USER_PROFILE.avatarUrl} alt={USER_PROFILE.name} className="w-full h-full object-cover" />
            ) : USER_PROFILE.name ? (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-300">{USER_PROFILE.name[0]}</span>
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </span>
        </button>
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

const DUMMY_ACTIVE_OPERATIONS = [
  { id: 1, phase: 'INSPECT PHASE', title: 'Fintech Dashboard V2', client: 'Alpha Bank', progress: 75, nextAction: 'Review Codebase' },
  { id: 2, phase: 'ESCROW PHASE', title: 'E-Commerce Micro-interactions', client: 'ShopFlow', progress: 25, nextAction: 'Await Deposit' },
];
const DUMMY_MISSION_LOGS = [
  { id: 1, title: 'Health App UI Kit', client: 'MedCore', date: '2026.01.15', rating: 5, earned: 280000 },
  { id: 2, title: 'Crypto Wallet Icons', client: 'ChainLink', date: '2025.12.20', rating: 4.8, earned: 50000 },
  { id: 3, title: 'Landing Page Refresh', client: 'StartUp Inc', date: '2025.11.10', rating: 5, earned: 150000 },
];