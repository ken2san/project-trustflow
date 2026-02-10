import React from "react";

// Command Center: 一元管理ダッシュボード
const AI_INSIGHT = {
  Conservative: "AI Insight: Conservative mode prioritizes low-risk, stable contracts. Expect steady but moderate growth.",
  Balanced: "AI Insight: Balanced mode optimizes for both opportunity and safety. Good for consistent progress with some upside.",
  Aggressive: "AI Insight: Aggressive mode targets high-reward, high-risk contracts. Potential for rapid growth, but volatility is higher."
};

const AI_RATIONALE = {
  Conservative: "Rationale: Current market volatility is high and your recent operations show a preference for stability. Conservative mode is recommended if you want to minimize risk and preserve capital.",
  Balanced: "Rationale: Your operation history balances risk and reward, and market signals are mixed. Balanced mode is recommended for steady progress with some upside potential.",
  Aggressive: "Rationale: Market momentum is strong and your recent actions indicate a higher risk tolerance. Aggressive mode is recommended if you seek rapid growth and can accept higher volatility."
};

const CommandCenterView = ({ activeOperations = [], missionLogs = [], onOperationClick, strategy, onStrategyChange }) => {
  // Demo: filter/sort logic based on strategy
  let sortedOps = [...activeOperations];
  if (strategy === 'Conservative') {
    sortedOps.sort((a, b) => a.progress - b.progress); // lowest progress (risk) first
  } else if (strategy === 'Aggressive') {
    sortedOps.sort((a, b) => b.progress - a.progress); // highest progress (reward) first
  } else if (strategy === 'Balanced') {
    sortedOps.sort((a, b) => a.client.localeCompare(b.client)); // by client name
  }
  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Strategy and Active Operations */}
      <div>
        <div className="mb-4">
          <div className="mb-2 px-4 py-3 rounded-xl bg-indigo-900/60 border border-indigo-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-yellow-300"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 17v.01M12 7v4m0 8a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              <span className="text-xs text-indigo-100 font-semibold">{AI_INSIGHT[strategy]}</span>
            </div>
            <div className="mt-1 px-3 py-2 rounded-lg bg-indigo-950/70 border border-indigo-800/40">
              <span className="text-[11px] text-indigo-200 font-medium">{AI_RATIONALE[strategy]}</span>
            </div>
          </div>
        </div>
        <div className="mb-8 flex items-center gap-4">
          <span className="text-lg font-black uppercase tracking-widest text-indigo-400">Strategy</span>
          <div className="flex gap-2">
            {['Conservative','Balanced','Aggressive'].map(level => {
              // For now, AI always recommends 'Balanced'.
              const isRecommended = level === 'Balanced';
              return (
                <button
                  key={level}
                  className={`px-4 py-2 rounded-full font-bold text-xs border transition-all duration-200 ${strategy === level ? 'bg-indigo-500 text-white border-indigo-500 scale-110' : 'bg-white/10 text-indigo-400 border-white/10 hover:bg-indigo-400/10 hover:text-indigo-500'} ${isRecommended ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                  onClick={() => onStrategyChange(level)}
                  type="button"
                >
                  {level}
                  {isRecommended && (
                    <span className="ml-2 text-amber-400 text-[10px] font-bold align-middle">AI</span>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-slate-400 ml-2">Selected: <span className="font-bold text-indigo-300">{strategy}</span></span>
        </div>
        <h2 className="text-lg font-black uppercase tracking-widest text-indigo-400 mb-8">Active Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sortedOps.map(op => (
            <button
              key={op.id}
              className="bg-[#0f172a]/60 rounded-[36px] p-8 border border-white/5 shadow-xl text-left transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onClick={() => onOperationClick && onOperationClick(op)}
              type="button"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">{op.phase}</span>
                <span className="text-slate-400 text-xs">{op.client}</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{op.title}</h3>
              <div className="mb-2 text-xs text-slate-400">Progress</div>
              <div className="w-full h-2 bg-white/10 rounded-full mb-2 overflow-hidden">
                <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${op.progress}%` }} />
              </div>
              <div className="text-xs text-slate-400">Next: <span className="font-bold text-white">{op.nextAction}</span></div>
            </button>
          ))}
        </div>
      </div>
      {/* Mission Logs */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-widest text-indigo-400 mt-12 mb-4">Mission Logs</h2>
        <div className="space-y-4">
          {missionLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between bg-white/[0.02] rounded-[24px] p-6 border border-white/5">
              <div>
                <div className="font-black text-white text-base">{log.title}</div>
                <div className="text-xs text-slate-500">{log.client} ・ {log.date}</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-xs text-yellow-400 font-bold flex items-center gap-1">★ {log.rating}</div>
                <div className="text-xs font-black text-emerald-400">+{log.earned.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default CommandCenterView;
