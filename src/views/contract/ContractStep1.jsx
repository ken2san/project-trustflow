import React from "react";
import HoldButton from "../../components/ui/HoldButton";
import { ArrowRight } from "lucide-react";

const ContractStep1 = ({
    contractDeadline, setContractDeadline,
    mutualStakeEnabled, setMutualStakeEnabled,
    mutualStakeAmount, setMutualStakeAmount,
    autoReleaseArmed, setAutoReleaseArmed,
    handleNextStep, status
}) => (
    <div className="space-y-10 animate-fade-in-up">
        <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white leading-none">Commitment Locked</h2>
        <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">Funds secured in escrow. Both parties are protected from this point forward.<br/>This action cannot be undone.</p>
        <div className="max-w-md mx-auto text-left space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project Deadline <span className="text-slate-700">(optional)</span></label>
                <input
                    type="date"
                    value={contractDeadline}
                    onChange={e => setContractDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                />
                <p className="text-xs text-slate-600">If set, you'll be alerted if no delivery arrives by this date.</p>
            </div>
            <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-black text-slate-300">Mutual Stake</p>
                        <p className="text-xs text-slate-600">Both parties put skin in the game</p>
                    </div>
                    <button
                        onClick={() => setMutualStakeEnabled(v => !v)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${mutualStakeEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${mutualStakeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                {mutualStakeEnabled && (
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Earner stakes (PTS)</label>
                        <input
                            type="number"
                            value={mutualStakeAmount}
                            onChange={e => setMutualStakeAmount(e.target.value)}
                            placeholder="e.g. 50000"
                            min={0}
                            className="w-full bg-slate-800/60 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <p className="text-xs text-slate-600 mt-1">Earner's stake is returned on approval.</p>
                    </div>
                )}
                {contractDeadline && (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-300">Auto-Release on deadline</p>
                            <p className="text-xs text-slate-600">Funds auto-release if no delivery by deadline</p>
                        </div>
                        <button
                            onClick={() => setAutoReleaseArmed(v => !v)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${autoReleaseArmed ? 'bg-amber-600' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoReleaseArmed ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                )}
            </div>
        </div>
        <HoldButton
            key="btn-1"
            onClick={handleNextStep}
            label="Secure Funds in Escrow"
            icon={ArrowRight}
            className="btn-primary-hold w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-2xl"
            disabled={status !== 'idle'}
        />
    </div>
);

export default ContractStep1;
