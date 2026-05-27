import React, { useMemo } from "react";
import { ArrowLeft, Award, TrendingUp, TrendingDown, Shield, Star, Zap, Target } from "lucide-react";
import SpotlightCard from "../components/ui/SpotlightCard";
import ScrambleText from "../components/ui/ScrambleText";
import { computeBalance, getUnlockedBadges, getNextBadge, TRUSTPOINTS_RULES } from "../lib/trustpoints";

const DeltaIcon = ({ delta }) =>
  delta > 0
    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
    : <TrendingDown className="w-5 h-5 text-rose-400" />;

const REASON_CODE_COLOR = {
  CONTRACT_COMPLETED: 'text-emerald-400',
  CONTRACT_COMPLETED_ON_TIME: 'text-emerald-400',
  CONTRACT_COMPLETED_HIRER: 'text-emerald-400',
  DISPUTE_WON: 'text-indigo-400',
  HIGH_RATING_RECEIVED: 'text-amber-400',
  FIRST_CONTRACT: 'text-violet-400',
  REFERRAL_JOINED: 'text-sky-400',
  CONTRACT_CANCELLED: 'text-rose-400',
  DISPUTE_LOST: 'text-rose-400',
  GHOSTING_FLAG: 'text-rose-600',
  FEE_DISCOUNT_1PCT: 'text-amber-300',
  PRIORITY_ARBITRATION: 'text-amber-300',
  TRUST_PASSPORT_FEATURED: 'text-amber-300',
};

const WalletView = ({ onBack, trustPointsLedger = [], trustScore = 0, contractsCompleted = 0, formatNumber }) => {
  const { balance, lifetimeEarned } = useMemo(() => computeBalance(trustPointsLedger), [trustPointsLedger]);
  const unlockedBadges = useMemo(() => getUnlockedBadges(lifetimeEarned), [lifetimeEarned]);
  const nextBadge = useMemo(() => getNextBadge(lifetimeEarned), [lifetimeEarned]);
  const progressPct = nextBadge
    ? Math.round(((lifetimeEarned - (nextBadge.badge.threshold - nextBadge.remaining)) / nextBadge.remaining) * 100)
    : 100;

  return (
    <div className="space-y-12 animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] pl-2 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left: Passport card + badges ── */}
        <div className="lg:col-span-4 space-y-6">
          <SpotlightCard className="bg-gradient-to-br from-indigo-600 to-violet-900 rounded-[48px] p-8 text-white shadow-[0_30px_80px_rgba(79,70,229,0.3)]">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">Trust Passport</p>
                  <Shield className="w-6 h-6 opacity-70" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-50">TrustFlow</span>
              </div>
              <h2 className="text-6xl font-black italic mb-1 leading-none tracking-tighter">
                <ScrambleText text={balance.toLocaleString()} />
              </h2>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-8">TrustPoints balance</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Trust Score</p>
                  <p className="font-black text-2xl">{trustScore}<span className="text-xs opacity-50 ml-1">/ 1000</span></p>
                </div>
                <div>
                  <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Completed</p>
                  <p className="font-black text-2xl">{contractsCompleted}<span className="text-xs opacity-50 ml-1">contracts</span></p>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {nextBadge && (
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Next Badge</p>
                  <p className="text-white font-black">{nextBadge.badge.icon} {nextBadge.badge.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{nextBadge.remaining} pts remaining</p>
                </div>
                <Target className="w-8 h-8 text-indigo-400 opacity-60" />
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
            </div>
          )}

          {unlockedBadges.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Award className="w-4 h-4" /> Badges Earned</p>
              <div className="flex flex-wrap gap-2">
                {unlockedBadges.map(b => (
                  <span key={b.id} title={b.description} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-black text-indigo-300">
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-5 text-xs text-amber-300/80 space-y-1">
            <p className="font-black flex items-center gap-2"><Zap className="w-4 h-4" /> Payments via Stripe</p>
            <p className="text-amber-400/60">Contract funds are held securely by Stripe and released automatically on completion. TrustPoints are separate and non-redeemable for cash.</p>
          </div>
        </div>

        {/* ── Right: Ledger ── */}
        <div className="lg:col-span-8">
          <div className="bg-[#0f172a]/60 rounded-[48px] p-10 border border-white/5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3"><Star className="w-7 h-7 text-indigo-500" /> Points History</h3>
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{lifetimeEarned.toLocaleString()} lifetime earned</span>
            </div>
            {trustPointsLedger.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-600 font-bold">No TrustPoints yet.</p>
                <p className="text-slate-700 text-sm mt-2">Complete your first contract to earn points.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trustPointsLedger.map(entry => {
                  const rule = TRUSTPOINTS_RULES[entry.reason_code];
                  const colorClass = REASON_CODE_COLOR[entry.reason_code] ?? 'text-slate-400';
                  const date = entry.created_at ? new Date(entry.created_at).toLocaleDateString('ja-JP') : '—';
                  return (
                    <div key={entry.id} className="flex items-center gap-5 p-5 bg-white/[0.02] rounded-[24px] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <DeltaIcon delta={entry.delta} />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm truncate">{rule?.label ?? entry.reason}</p>
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{date}</p>
                      </div>
                      <p className={`text-xl font-black italic whitespace-nowrap ${colorClass}`}>
                        {entry.delta > 0 ? '+' : ''}{entry.delta.toLocaleString()}
                        <span className="text-[9px] font-black text-slate-600 ml-1 uppercase tracking-widest">pts</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
