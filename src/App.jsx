import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Wallet,
  Coins,
  PlusCircle,
  Search,
  Sparkles,
  Zap,
  ArrowLeft,
  ListChecks,
  Activity,
  TrendingUp,
  Globe,
  Award,
  BadgeCheck,
  UploadCloud,
  X,
  Send,
  Paperclip,
  Fingerprint,
  Scale,
  BrainCircuit,
  Target,
  UserCheck,
  LayoutGrid,
  Bell,
  CreditCard,
  Loader2,
  Check,
  MousePointer2,
  FileSignature,
  Scan,
  Hash,
  RefreshCw,
  QrCode
} from 'lucide-react';

// --- Utility Components ---

// Neural Background with Floating Nodes
const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base Aurora */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-900/10 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />

      {/* Floating Particles (CSS Animation) */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-indigo-500/20 blur-xl animate-float"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 20}s`,
              animationDelay: `-${Math.random() * 20}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Spotlight Card Component (Layout Fix Applied)
const SpotlightCard = ({ children, className = "", onClick }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={`relative overflow-hidden border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.15), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.4), transparent 40%)`,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      {/* w-full added to ensure proper flex behavior */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};

// Hash Generation Effect
const HashGenerator = ({ length = 24, onComplete }) => {
  const [hash, setHash] = useState('');
  const chars = '0123456789ABCDEF';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setHash(
        Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
      );
      iteration += 1;
      if (iteration > 20) { // Run for a bit then finalize
        clearInterval(interval);
        const finalHash = '0x' + Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
        setHash(finalHash);
        if (onComplete) onComplete();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono">{hash}</span>;
};

// Hold-to-Confirm Button Component with Ripple
const HoldButton = ({ onClick, label, icon: Icon, className = "", color = "white" }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (progress >= 100 && !isCompleted) {
      clearInterval(intervalRef.current);
      setIsCompleted(true);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 1000);
      onClick(); // Trigger parent action
    }
  }, [progress, isCompleted, onClick]);

  const startHold = () => {
    if (isCompleted) return;
    intervalRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + 4, 100)); // Faster fill for snappy feel
    }, 16);
  };

  const endHold = () => {
    if (isCompleted) return;
    clearInterval(intervalRef.current);
    setProgress(0);
  };

  const bgClass = color === "indigo" ? "bg-indigo-600" : "bg-white";
  const textClass = color === "indigo" ? "text-white" : "text-[#020617]";
  const fillClass = color === "indigo" ? "bg-indigo-400" : "bg-indigo-500";

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      className={`relative overflow-hidden group select-none ${bgClass} ${textClass} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className={`absolute inset-0 ${fillClass} transition-all duration-75 ease-linear opacity-40`}
        style={{ width: `${progress}%` }}
      />

      {/* Ripple Effect */}
      {showRipple && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="animate-ripple absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
        </span>
      )}

      <div className="relative z-10 flex items-center justify-center gap-3 w-full h-full">
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 animate-scale-up" />
        ) : (
          <>
            <span className="font-black text-lg sm:text-xl transition-transform group-active:scale-95">{label}</span>
            {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />}
          </>
        )}
      </div>
    </button>
  );
};

const ScrambleText = ({ text, className, delay = 0, trigger }) => {
  const [display, setDisplay] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

  useEffect(() => {
    const textStr = String(text);
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        textStr
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return textStr[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= textStr.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    const startTimeout = setTimeout(() => {}, delay);
    return () => {
      clearInterval(interval);
      clearTimeout(startTimeout);
    };
  }, [text, delay, trigger]);

  return <span className={className}>{display}</span>;
};

const Typewriter = ({ text, delay = 30, onComplete }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, delay, text, onComplete]);

  return <span>{currentText}</span>;
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-24 right-6 z-[70] flex flex-col gap-3 pointer-events-none">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className="pointer-events-auto bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in-right max-w-sm"
      >
        <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-sm">{toast.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
        </div>
        <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const BiometricModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [scanStatus, setScanStatus] = useState('idle');

  useEffect(() => {
    if (isOpen) {
      setScanStatus('idle');
    }
  }, [isOpen]);

  const handleScan = () => {
    setScanStatus('scanning');
    setTimeout(() => {
      setScanStatus('success');
      setTimeout(() => {
        onAuthenticated();
      }, 800);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex flex-col items-center">
        <div
            className={`w-32 h-32 rounded-[32px] border-2 flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group ${
                scanStatus === 'success' ? 'border-emerald-500 bg-emerald-500/10' :
                scanStatus === 'scanning' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 bg-white/5 hover:border-indigo-400'
            }`}
            onClick={scanStatus === 'idle' ? handleScan : undefined}
        >
            {scanStatus === 'scanning' && (
                <div className="absolute inset-0 bg-indigo-500/20 animate-scan-vertical" />
            )}
            {scanStatus === 'success' ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-scale-up" />
            ) : (
                <Fingerprint className={`w-16 h-16 transition-colors ${scanStatus === 'scanning' ? 'text-indigo-400 animate-pulse' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            )}
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
            {scanStatus === 'idle' ? 'Touch to Authorize' :
             scanStatus === 'scanning' ? 'Verifying Biometrics...' :
             'Identity Confirmed'}
        </p>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-scale-up overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-2xl font-black text-white italic tracking-tighter">Add Funds</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-6 relative z-10">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <CreditCard className="w-8 h-8 opacity-80" />
                <span className="font-mono text-lg opacity-80">•••• 4242</span>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-60 tracking-widest mb-1">Balance</p>
                <p className="text-2xl font-black tracking-widest">$12,450.00</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Amount (USD)</label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                <span className="text-slate-400 font-bold">$</span>
                <input type="number" defaultValue="1000" className="bg-transparent border-none outline-none text-white font-mono text-xl flex-1" />
              </div>
            </div>
          </div>
          <HoldButton
            onClick={onConfirm}
            label="Confirm Deposit"
            icon={ArrowRight}
            className="w-full py-5 rounded-2xl shadow-xl"
            color="white"
          />
        </div>
      </div>
    </div>
  );
};

// Analytics Graph Component
const AnalyticsGraph = () => {
    const data = [20, 45, 30, 60, 55, 85, 70];
    const width = 100;
    const height = 40;
    const max = Math.max(...data);

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d / max) * height;
        return `${x},${y}`;
    });

    let d = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
        const [x, y] = points[i].split(',');
        const [prevX, prevY] = points[i-1].split(',');
        const cp1x = parseFloat(prevX) + (parseFloat(x) - parseFloat(prevX)) / 2;
        const cp1y = prevY;
        const cp2x = parseFloat(prevX) + (parseFloat(x) - parseFloat(prevX)) / 2;
        const cp2y = y;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
    }

    return (
        <div className="w-full h-32 relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`${d} L ${width},${height} L 0,${height} Z`} fill="url(#graphGradient)" className="opacity-50 transition-all duration-500 group-hover:opacity-70" />
                <path d={d} fill="none" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                {points.map((p, i) => {
                   const [x, y] = p.split(',');
                   return (
                       <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   );
                })}
            </svg>
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 pointer-events-none">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                     <span key={day} className="text-[8px] font-bold text-slate-500 uppercase">{day}</span>
                 ))}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState('loading');
  const [step, setStep] = useState(1);
  const [userPoints, setUserPoints] = useState(500000);
  const [selectedJob, setSelectedJob] = useState(null);
  const [status, setStatus] = useState('idle');

  // Feature States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Protocol initialized. DoD generated based on risk profile.', time: '10:00', type: 'text' },
    { id: 2, sender: 'client', text: 'Looking forward to the design system!', time: '10:05', type: 'text' }
  ]);
  const [inputText, setInputText] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [scrambleTrigger, setScrambleTrigger] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false); // For Wallet Card Flip

  const chatEndRef = useRef(null);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        setView('marketplace');
        addToast('System Ready', 'Neural Trust Engine is active.', 'success');
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const handleStartScoping = (job) => {
    setSelectedJob(job);
    setView('scoping');
  };

  const initiateContractSequence = () => {
      setIsBiometricOpen(true);
  };

  const handleBiometricSuccess = () => {
    setIsBiometricOpen(false);
    setView('contract');
    setStep(1);
    addToast('Identity Verified', 'Biometric signature applied to contract.', 'success');
  };

  const handleNext = () => {
    setStatus('processing');
    setTimeout(() => {
      if (step === 1 && selectedJob) {
         addToast('Funds Locked', `${selectedJob.totalPoints.toLocaleString()} PTS moved to Escrow.`);
      }
      if (step === 2 && selectedJob) {
        setUserPoints(prev => prev - selectedJob.totalPoints);
      }
      if (step === 3) {
          setShowConfetti(true);
          addToast('Transaction Settled', 'Funds released to vendor.', 'success');
          setTimeout(() => setShowConfetti(false), 5000);
      }
      setStep(prev => prev + 1);
      setStatus('idle');
    }, 1500);
  };

  // AI-Driven Dynamic Contract Update Logic
  const triggerSmartContractUpdate = () => {
    const userMsg = { id: Date.now(), sender: 'me', text: 'Additional requirements for dark mode have come up. Can we increase the budget?', time: 'Now', type: 'text' };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
        const aiProposal = {
            id: Date.now() + 1,
            sender: 'ai',
            type: 'contract_update',
            data: {
                title: 'Scope Expansion Detected',
                changes: ['Add: Dark Mode Variants (+12 Screens)', 'Timeline: +2 Days'],
                additionalCost: 50000,
                newTotal: selectedJob.totalPoints + 50000
            },
            time: 'Now'
        };
        setMessages(prev => [...prev, aiProposal]);
    }, 1500);
  };

  const acceptContractUpdate = (updateData) => {
      setSelectedJob(prev => ({
          ...prev,
          totalPoints: updateData.newTotal,
          acceptanceCriteria: [...prev.acceptanceCriteria, "Dark Mode Variants Completed"]
      }));
      setScrambleTrigger(prev => prev + 1);

      setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'system',
          text: `Contract updated. Budget increased by ${updateData.additionalCost.toLocaleString()} PTS.`,
          time: 'Now',
          type: 'text'
      }]);
      addToast('Smart Contract Updated', 'New budget locked in escrow.', 'success');
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'me', text: inputText, time: 'Now', type: 'text' }]);
    setInputText('');
    setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: 'Context updated. Evidence logged.', time: 'Now', type: 'text' }]);
    }, 1000);
  };

  const handleFileUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadProgress(0);
            handleNext();
            addToast('Upload Complete', 'AI Inspection initiated.', 'success');
        }
    }, 80);
  };

  const handleDeposit = () => {
      setIsPaymentModalOpen(false);
      setStatus('processing');
      setTimeout(() => {
          setUserPoints(prev => prev + 100000);
          setStatus('idle');
          addToast('Deposit Successful', '100,000 PTS added to Vault.', 'success');
      }, 1000);
  };

  const MatchCircle = ({ score, size = "large" }) => {
    const radius = size === "large" ? 50 : 35;
    const viewBoxSize = 120;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className={`flex flex-col items-center justify-center relative ${size === "large" ? "w-32 h-32 sm:w-40 sm:h-40" : "w-20 h-20"}`}>
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1E293B" strokeWidth="6" />
          <circle
            cx="60" cy="60" r={radius} fill="none" stroke="url(#indigoGradient)"
            strokeWidth="6" strokeDasharray={circumference}
            strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative z-10 text-center">
          <span className={`${size === "large" ? "text-3xl sm:text-4xl" : "text-xl"} font-black italic text-white leading-none block tracking-tighter`}>
            <ScrambleText text={`${score}%`} />
          </span>
          <span className={`${size === "large" ? "text-[8px] sm:text-[10px]" : "text-[7px]"} font-black text-slate-500 uppercase tracking-widest mt-1 block`}>Match</span>
        </div>
      </div>
    );
  };

  const jobs = [
    {
      id: 1,
      title: "Mobile App Design System",
      client: "Neo-Digital Inc.",
      clientTrust: 99,
      totalPoints: 300000,
      aiScore: 98,
      matchReason: "Neural match verified: 85% overlap with your component library. High-efficiency target.",
      acceptanceCriteria: [
        "Definitive Figma Component Library",
        "Dark/Light Mode Token Architecture",
        "Atomic Design Compliance"
      ]
    },
    {
      id: 2,
      title: "AI Chatbot UI Kit",
      client: "Future Labs",
      clientTrust: 85,
      totalPoints: 150000,
      aiScore: 94,
      matchReason: "Contextual match found. Leverage your existing AI assets for 20% efficiency gain.",
      acceptanceCriteria: [
        "WCAG 2.1 Contrast Compliance",
        "Full Responsive Liquid Layout",
        "Motion Interaction JSON"
      ]
    }
  ];

  const transactions = [
    { id: 'TX-991', title: 'Logo Animation', type: 'in', points: 45000, date: '2026.02.05' },
    { id: 'TX-988', title: 'UI Audit Service', type: 'in', points: 120000, date: '2026.01.28' },
    { id: 'TX-982', title: 'Network Fee', type: 'out', points: 5000, date: '2026.01.20' }
  ];

  const steps = [
    { id: 1, label: 'PROTOCOL' }, { id: 2, label: 'ESCROW' }, { id: 3, label: 'INSPECT' }, { id: 4, label: 'RELEASE' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <NeuralBackground />

      {showConfetti && (
          <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex justify-center">
              {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute top-0 w-2 h-2 bg-emerald-400 rounded-full animate-fall" style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`
                  }} />
              ))}
          </div>
      )}

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Modals */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleDeposit} />
      <BiometricModal isOpen={isBiometricOpen} onClose={() => setIsBiometricOpen(false)} onAuthenticated={handleBiometricSuccess} />

      {view === 'loading' && (
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-40 animate-pulse" />
            <div className="w-24 h-24 bg-[#0a0f1e] rounded-[32px] border border-indigo-500/30 flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <ShieldCheck className="text-indigo-400 w-12 h-12 animate-pulse" />
            </div>
          </div>
          <p className="text-indigo-400 font-black tracking-[0.6em] text-[11px] uppercase animate-pulse">Initializing Trust Neural Net</p>
        </div>
      )}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setView('marketplace'); setSelectedJob(null); }}>
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-xl tracking-tighter text-white block leading-none">TRUSTFLOW<span className="text-indigo-500">.</span></span>
            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Protocol v3.5</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div
            onClick={() => setView('wallet')}
            className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] px-4 py-2 rounded-full border border-white/5 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-end">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Liquid Assets</p>
              <div className="flex items-center gap-1.5 text-white group-hover:text-amber-400 transition-colors">
                <Coins className="w-3 h-3 text-amber-500" />
                <span className="font-mono font-bold text-xs">{userPoints.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
               <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative bg-white/5">
            <Bell className="w-4 h-4 text-slate-300" />
            <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_#f43f5e]" />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-32 max-w-6xl mx-auto px-6 relative z-10">

        {/* VIEW: Marketplace */}
        {view === 'marketplace' && (
          <div className="space-y-20 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="shrink-0 relative group">
                <div className="w-32 h-32 relative flex items-center justify-center">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40px] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700" />
                   <div className="w-full h-full bg-[#0a0f1e] border border-white/5 rounded-[40px] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden backdrop-blur-3xl">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-400/80 blur-[2px] animate-scan" />
                      <BrainCircuit className="text-indigo-400 w-16 h-16 relative z-10 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)] animate-pulse" />
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 z-20">
                  <div className="w-12 h-12 bg-[#050b14] rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400 backdrop-blur-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white leading-[0.9]">
                  <Typewriter text="Hello, Felix." /> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600 italic font-medium tracking-tight text-4xl sm:text-6xl">
                    I've isolated <span className="text-indigo-400 border-b-4 border-indigo-500/30 pb-1">2 prime vectors</span>.
                  </span>
                </h1>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    <Activity className="w-3.5 h-3.5" /> Neural Match Active
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    <Award className="w-3.5 h-3.5" /> Professional Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {jobs.map(job => (
                <SpotlightCard
                  key={job.id}
                  onClick={() => handleStartScoping(job)}
                  className="group rounded-[48px] p-6 md:p-10 shadow-2xl cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full">
                    <div className="shrink-0 flex flex-col items-center gap-8 relative z-10">
                      <MatchCircle score={job.aiScore} />
                    </div>

                    <div className="flex-1 space-y-8 relative z-10 text-center md:text-left min-w-0">
                      <div>
                        <h3 className="text-3xl sm:text-5xl font-black mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-200 transition-all tracking-tighter leading-none">{job.title}</h3>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border border-white/5">{job.client}</span>
                          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                            <ShieldCheck className="w-3 h-3" /> 99.8% Trusted
                          </div>
                        </div>
                      </div>

                      <div className="relative pl-6 border-l-2 border-indigo-500/30">
                        <p className="text-sm sm:text-lg font-medium leading-relaxed text-slate-300 italic">"{job.matchReason}"</p>
                      </div>

                      <div className="flex flex-wrap gap-8 justify-center md:justify-start pt-2">
                        <div className="text-center md:text-left">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Reward</p>
                          <p className="text-3xl font-black italic text-white leading-none tracking-tight">
                              <ScrambleText text={job.totalPoints.toLocaleString()} trigger={scrambleTrigger} /> <span className="text-xs not-italic text-slate-500 font-bold">PTS</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 relative z-10 w-full md:w-auto mt-8 md:mt-0 md:ml-auto">
                      <button className="w-full md:w-auto bg-white text-[#020617] px-10 py-6 rounded-[28px] font-black text-lg hover:bg-indigo-400 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3 group-hover:translate-x-1">
                        Initialize <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Scoping */}
        {view === 'scoping' && selectedJob && (
          <div className="space-y-12 animate-fade-in-up">
            <button onClick={() => setView('marketplace')} className="flex items-center gap-3 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] group pl-2">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              Abort Sequence
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0f172a]/60 rounded-[48px] p-10 sm:p-14 border border-white/5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                      <ListChecks className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-5xl font-black tracking-tighter italic text-white leading-none">Acceptance Protocol</h1>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Definition of Done (DoD)</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {selectedJob.acceptanceCriteria.map((criterion, i) => (
                      <div key={i} className="flex items-start gap-6 p-6 bg-white/[0.02] rounded-[32px] border border-white/5 hover:bg-white/[0.04] transition-all cursor-default">
                        <div className="w-8 h-8 bg-[#0a0f1e] border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-slate-300 leading-relaxed text-base pt-1">{criterion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0f172a]/80 rounded-[48px] p-10 border border-white/10 shadow-2xl sticky top-32 backdrop-blur-xl transition-all">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Contract Value</p>
                  <h2 className="text-4xl sm:text-6xl font-black italic text-white mb-10 leading-none tracking-tighter drop-shadow-xl break-words">
                    <ScrambleText text={selectedJob.totalPoints.toLocaleString()} trigger={scrambleTrigger} /> <span className="text-sm not-italic text-slate-500 block mt-2 uppercase tracking-widest font-bold">TrustPoints</span>
                  </h2>
                  <button
                    onClick={initiateContractSequence}
                    className="w-full bg-white text-[#020617] py-6 rounded-[28px] font-black text-lg hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    <Fingerprint className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    Sign & Fund
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Contract Flow */}
        {view === 'contract' && selectedJob && (
          <div className="animate-fade-in-up space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 bg-[#0f172a]/40 rounded-[56px] p-8 sm:p-16 border border-white/[0.05] min-h-[600px] relative overflow-hidden shadow-2xl backdrop-blur-2xl">
                {status === 'processing' && (
                  <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="font-black text-indigo-400 animate-pulse text-[11px] tracking-[0.5em] uppercase">Processing Node...</p>
                  </div>
                )}

                {/* Step 1: Commitment */}
                {step === 1 && (
                  <div className="animate-fade-in-up space-y-10">
                    <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white leading-none">Final Commitment</h2>
                    <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
                      Final agreement to DoD. Funds will be moved to the decentralized vault.
                      {/* Generative Hash Animation */}
                      <br/><span className="text-sm font-mono text-indigo-400 mt-2 block"><HashGenerator length={32} /></span>
                    </p>
                    <div className="bg-white/5 p-10 rounded-[48px] border border-white/10 space-y-8">
                       <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Verification Layer</h4>
                       <div className="space-y-5 text-sm sm:text-base font-bold text-slate-300">
                          <div className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-indigo-500" /> 100% Payment Guarantee via Escrow</div>
                          <div className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-indigo-500" /> AI Neural Auto-Arbitration</div>
                          <div className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-indigo-500" /> Immutable Ledger Recording</div>
                       </div>
                    </div>
                    <HoldButton
                        onClick={handleNext}
                        label="Activate Trust Stream"
                        icon={ArrowRight}
                        className="w-full bg-white text-[#020617] py-7 rounded-[32px] font-black text-xl shadow-2xl"
                        color="white"
                    />
                  </div>
                )}

                {/* Step 2: Build & Upload */}
                {step === 2 && (
                  <div className="animate-fade-in-up text-center py-16 space-y-12">
                    {isUploading ? (
                        <div className="space-y-8">
                            <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
                                    <circle cx="64" cy="64" r="50" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 - (314 * uploadProgress / 100)} strokeLinecap="round" className="transition-all duration-100" />
                                </svg>
                                <span className="absolute text-2xl font-black text-white">{uploadProgress}%</span>
                            </div>
                            <p className="text-indigo-400 font-black tracking-widest uppercase animate-pulse">Scanning Artifacts...</p>
                        </div>
                    ) : (
                        <>
                            <div className="border-4 border-dashed border-white/10 rounded-[48px] p-16 flex flex-col items-center justify-center gap-6 hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group" onClick={handleFileUpload}>
                                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white">Submit Deliverables</h3>
                            </div>
                        </>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="animate-fade-in-up space-y-10">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full border border-amber-500/20 uppercase tracking-widest animate-pulse">Scanning Evidence</span>
                    </div>
                    <h2 className="text-4xl font-black italic text-white leading-none tracking-tighter">Neural Inspection</h2>
                    <p className="text-slate-400 text-lg">Cross-referencing deliverables with DoD parameters.</p>
                    <div className="bg-black/40 rounded-[48px] p-8 sm:p-10 border border-white/5 space-y-5">
                       {selectedJob.acceptanceCriteria.map((c, i) => (
                         <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-colors">
                            <span className="text-sm sm:text-base font-bold text-slate-300">{c}</span>
                            <div className="flex items-center gap-3 text-emerald-400 font-black text-[11px] uppercase tracking-[0.2em]"><span>Matched</span> <CheckCircle2 className="w-5 h-5" /></div>
                         </div>
                       ))}
                    </div>
                    <div className="flex gap-6">
                      <button className="px-10 border border-white/10 py-6 rounded-[32px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all text-lg">Reject</button>
                      <HoldButton
                        onClick={handleNext}
                        label="Approve & Release"
                        className="flex-1 bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl"
                        color="indigo"
                      />
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="animate-fade-in-up text-center py-16 space-y-10">
                    <div className="w-40 h-40 bg-emerald-500/10 rounded-[64px] flex items-center justify-center mx-auto relative border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                      <Unlock className="w-20 h-20 text-emerald-500 animate-pulse" />
                    </div>
                    <h2 className="text-5xl sm:text-7xl font-black italic text-white leading-none uppercase tracking-tighter">Settled</h2>
                    <button onClick={() => { setView('marketplace'); setSelectedJob(null); setStep(1); }} className="bg-white text-slate-900 px-16 py-7 rounded-[32px] font-black hover:bg-indigo-400 hover:text-white transition-all shadow-2xl text-xl active:scale-95">Return to Feed</button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 space-y-8 hidden lg:block">
                 <div className="bg-[#0f172a]/60 rounded-[48px] p-10 border border-white/5 shadow-2xl backdrop-blur-md">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 flex items-center gap-3"><Fingerprint className="w-5 h-5 text-indigo-400" /> Transaction Node</h3>
                    <div className="space-y-8">
                       <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-slate-500"><span>Ledger Security</span><span className="text-emerald-500">Maximum</span></div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 w-[100%] animate-pulse" /></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Wallet */}
        {view === 'wallet' && (
          <div className="space-y-12 animate-fade-in-up">
            <button onClick={() => setView('marketplace')} className="flex items-center gap-2 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] pl-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Feed
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <SpotlightCard className="bg-gradient-to-br from-indigo-600 to-violet-900 rounded-[56px] p-8 sm:p-12 text-white shadow-[0_30px_80px_rgba(79,70,229,0.3)] group">
                  {/* Flip Card functionality simulation */}
                  <div className="flex flex-col relative z-10 w-full h-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                     <div className={`transition-all duration-500 ${isFlipped ? 'opacity-0 absolute' : 'opacity-100'}`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                        <div className="flex justify-between items-start mb-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Net Liquidity</p>
                            <RefreshCw className="w-4 h-4 opacity-50" />
                        </div>
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black italic mb-12 leading-none tracking-tighter break-words">
                        <ScrambleText text={userPoints.toLocaleString()} /> <span className="text-sm not-italic opacity-60 block mt-4 uppercase tracking-widest font-bold">TrustPoints</span>
                        </h2>
                     </div>

                     <div className={`transition-all duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <QrCode className="w-32 h-32 text-white/90" />
                                <RefreshCw className="w-4 h-4 opacity-50" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Wallet Address</p>
                                <p className="font-mono text-xs opacity-80 break-all">0x71C...9A21</p>
                            </div>
                        </div>
                     </div>

                    <div className={`space-y-5 relative z-10 transition-all duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsPaymentModalOpen(true); }}
                        className="w-full bg-white text-indigo-900 py-6 rounded-[32px] font-black text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                      >
                        <PlusCircle className="w-6 h-6" /> Charge Wallet
                      </button>
                      <button className="w-full bg-black/20 border border-white/20 text-white py-6 rounded-[32px] font-black text-lg hover:bg-white/10 transition-all active:scale-95">
                        Withdraw Fiat
                      </button>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0f172a]/60 rounded-[56px] p-12 border border-white/5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
                      <Activity className="w-8 h-8 text-indigo-500" /> Revenue Stream
                    </h3>
                  </div>
                  {/* Added Analytics Graph */}
                  <AnalyticsGraph />
                  <div className="space-y-6 mt-8">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-8 bg-white/[0.02] rounded-[36px] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer">
                        <div className="flex items-center gap-8">
                          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            <TrendingUp className={`w-8 h-8 ${tx.type === 'out' ? 'rotate-180' : ''}`} />
                          </div>
                          <div>
                            <p className="font-black text-white text-xl tracking-tight group-hover:text-indigo-300 transition-colors">{tx.title}</p>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2">{tx.id} • {tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black italic tracking-tight ${tx.type === 'in' ? 'text-emerald-500' : 'text-slate-300'}`}>
                            {tx.type === 'in' ? '+' : '-'}{tx.points.toLocaleString()}
                          </p>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none">PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Chat Overlay */}
      <div className="fixed bottom-24 sm:bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        {isChatOpen && (
            <div className="w-80 sm:w-96 h-[500px] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-white" /></div>
                        <div>
                            <p className="font-black text-white text-sm">Context Chat</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            {msg.type === 'contract_update' ? (
                                <div className="max-w-[90%] w-full bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-[24px] rounded-bl-none">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-300">
                                        <FileSignature className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Smart Contract Proposal</span>
                                    </div>
                                    <h4 className="font-bold text-white mb-2">{msg.data.title}</h4>
                                    <ul className="space-y-1 mb-4">
                                        {msg.data.changes.map((change, i) => (
                                            <li key={i} className="text-xs text-slate-300 flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> {change}</li>
                                        ))}
                                    </ul>
                                    <div className="flex justify-between items-end mb-4 pt-3 border-t border-white/10">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Cost Impact</span>
                                        <span className="text-lg font-black text-white">+{msg.data.additionalCost.toLocaleString()} PTS</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Reject</button>
                                        <button onClick={() => acceptContractUpdate(msg.data)} className="flex-1 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500">Accept Update</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-none' : msg.sender === 'ai' ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-200 rounded-bl-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                                    {msg.sender === 'ai' && <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI System Log</p>}
                                    {msg.text}
                                    <p className="text-[9px] opacity-50 mt-2 text-right">{msg.time}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-white/5 bg-[#020617]/50">
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-slate-500"
                        />
                        <button onClick={handleSendMessage} className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500"><Send className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        )}
        <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-110 transition-transform active:scale-95"
        >
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/10 px-8 py-5 flex justify-between items-center z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
        <button
          className={`p-3 transition-all duration-300 ${view === 'marketplace' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => { setView('marketplace'); setSelectedJob(null); }}
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button className="p-3 text-slate-500"><Search className="w-6 h-6" /></button>
        <button
          className={`p-3 transition-all duration-300 ${view === 'wallet' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setView('wallet')}
        >
          <Wallet className="w-6 h-6" />
        </button>
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
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
        @keyframes scanVertical {
            0% { top: 0; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan-vertical {
            animation: scanVertical 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;