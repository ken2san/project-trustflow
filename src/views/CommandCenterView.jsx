import React from "react";

// Command Center: 一元管理ダッシュボード
const CommandCenterView = ({ activeOperations = [], missionLogs = [], onOperationClick }) => (
  <div className="space-y-12 animate-fade-in-up">
    <h2 className="text-lg font-black uppercase tracking-widest text-indigo-400 mb-8">Active Operations</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {activeOperations.map(op => (
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
);

export default CommandCenterView;
