import React from "react";
import HoldButton from "../../components/ui/HoldButton";
import { ArrowRight, Plus, X } from "lucide-react";
import { TRUST_LADDER } from "../../lib/constants";

const ContractStep1 = ({
    contractDeadline, setContractDeadline,
    mutualStakeEnabled, setMutualStakeEnabled,
    mutualStakeAmount, setMutualStakeAmount,
    autoReleaseArmed, setAutoReleaseArmed,
    milestonesEnabled, setMilestonesEnabled,
    milestones, setMilestones,
    stagedDeliveryEnabled, setStagedDeliveryEnabled,
    userLevel,
    handleNextStep, status
}) => {
    const addMilestone = () =>
        setMilestones(prev => [...prev, { id: Date.now(), name: '', amount: '' }]);
    const removeMilestone = (id) =>
        setMilestones(prev => prev.filter(m => m.id !== id));
    const updateMilestone = (id, field, value) =>
        setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));

    const tier = [...TRUST_LADDER].reverse().find(t => (userLevel ?? 1) >= t.level) || TRUST_LADDER[0];
    const limitLabel = tier.contractLimit ? `${tier.contractLimit.toLocaleString()} PTS` : 'Unlimited';

    return (
        <div className="space-y-10 animate-fade-in-up">
            <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white leading-none">Commitment Locked</h2>
            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">Funds secured in escrow. Both parties are protected from this point forward.<br/>This action cannot be undone.</p>

            {/* Trust Ladder tier indicator */}
            <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold">
                <span className="text-indigo-400 uppercase tracking-widest">{tier.label}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">Contract limit: <span className="text-white">{limitLabel}</span></span>
            </div>

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
                    {/* Mutual Stake */}
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

                    {/* Feature #3: Milestone Payments */}
                    <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-300">Milestone Payments</p>
                                <p className="text-xs text-slate-600">Split payment across delivery stages</p>
                            </div>
                            <button
                                onClick={() => { setMilestonesEnabled(v => !v); if (stagedDeliveryEnabled) setStagedDeliveryEnabled(false); }}
                                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${milestonesEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${milestonesEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        {milestonesEnabled && (
                            <div className="mt-3 space-y-2">
                                {milestones.map((m, i) => (
                                    <div key={m.id} className="flex gap-2 items-center">
                                        <span className="text-xs text-slate-500 w-5 flex-shrink-0">{i + 1}.</span>
                                        <input
                                            type="text"
                                            placeholder="Stage name"
                                            value={m.name}
                                            onChange={e => updateMilestone(m.id, 'name', e.target.value)}
                                            className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500/40"
                                        />
                                        <input
                                            type="number"
                                            placeholder="PTS"
                                            value={m.amount}
                                            onChange={e => updateMilestone(m.id, 'amount', e.target.value)}
                                            min={0}
                                            className="w-24 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500/40"
                                        />
                                        <button onClick={() => removeMilestone(m.id)} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addMilestone}
                                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold mt-1 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Stage
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Feature #11: Staged Delivery */}
                    {!milestonesEnabled && (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-300">Staged Delivery</p>
                                <p className="text-xs text-slate-600">Preview → Approve → Full delivery</p>
                            </div>
                            <button
                                onClick={() => setStagedDeliveryEnabled(v => !v)}
                                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${stagedDeliveryEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${stagedDeliveryEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
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
};

export default ContractStep1;
