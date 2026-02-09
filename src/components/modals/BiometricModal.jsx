// filepath: src/components/modals/BiometricModal.jsx
import React, { useState, useEffect } from "react";
import { Fingerprint, CheckCircle2 } from "lucide-react";

const BiometricModal = ({ isOpen, onClose, onAuthenticated }) => {
  const [scanStatus, setScanStatus] = useState('idle');
  useEffect(() => { if (isOpen) setScanStatus('idle'); }, [isOpen]);
  const handleScan = () => {
    setScanStatus('scanning');
    setTimeout(() => {
      setScanStatus('success');
      setTimeout(onAuthenticated, 800);
    }, 2000);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={onClose} /><div className="relative flex flex-col items-center"><div className={`w-32 h-32 rounded-[32px] border-2 flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden group ${scanStatus === 'success' ? 'border-emerald-500 bg-emerald-500/10' : scanStatus === 'scanning' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 bg-white/5 hover:border-indigo-400'}`} onClick={scanStatus === 'idle' ? handleScan : undefined}>{scanStatus === 'scanning' && (<div className="absolute inset-0 bg-indigo-500/20 animate-scan-vertical" />)}{scanStatus === 'success' ? (<CheckCircle2 className="w-16 h-16 text-emerald-500 animate-scale-up" />) : (<Fingerprint className={`w-16 h-16 transition-colors ${scanStatus === 'scanning' ? 'text-indigo-400 animate-pulse' : 'text-slate-500 group-hover:text-indigo-400'}`} />)}</div><p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">{scanStatus === 'idle' ? 'Touch to Authorize' : scanStatus === 'scanning' ? 'Verifying Biometrics...' : 'Identity Confirmed'}</p></div></div>
  );
};

export default BiometricModal;
