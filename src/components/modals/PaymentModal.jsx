// filepath: src/components/modals/PaymentModal.jsx
import React from "react";
import { CreditCard, X, ArrowRight } from "lucide-react";
import HoldButton from "../ui/HoldButton";

const PaymentModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-scale-up overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" /><div className="flex justify-between items-center mb-8 relative z-10"><h3 className="text-2xl font-black text-white italic tracking-tighter">Add Funds</h3><button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div><div className="space-y-6 relative z-10"><div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group"><div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" /><div className="relative z-10"><div className="flex justify-between items-start mb-8"><CreditCard className="w-8 h-8 opacity-80" /><span className="font-mono text-lg opacity-80">•••• 4242</span></div><div><p className="text-[10px] uppercase opacity-60 tracking-widest mb-1">Balance</p><p className="text-2xl font-black tracking-widest">$12,450.00</p></div></div></div><div className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Amount (USD)</label><div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"><span className="text-slate-400 font-bold">$</span><input type="number" defaultValue="1000" className="bg-transparent border-none outline-none text-white font-mono text-xl flex-1" /></div></div></div><HoldButton onClick={onConfirm} label="Confirm Deposit" icon={ArrowRight} className="w-full py-5 rounded-2xl shadow-xl" color="white" /></div></div></div>
  );
};

export default PaymentModal;
