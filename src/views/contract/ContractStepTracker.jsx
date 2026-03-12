import React from "react";
import { CheckCircle2 } from "lucide-react";

const STEPS_DATA = [
    { id: 1, label: 'PROTOCOL' },
    { id: 2, label: 'ESCROW' },
    { id: 3, label: 'INSPECT' },
    { id: 4, label: 'RATING' }
];

const ContractStepTracker = ({ step }) => (
    <div className="mb-16 flex flex-wrap justify-between items-center max-w-2xl mx-auto relative px-1 sm:px-4 gap-2">
        {STEPS_DATA.map((s, idx) => (
            <React.Fragment key={s.id}>
                <div className="flex flex-col items-center z-10">
                    <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 transition-all duration-700 ${step > s.id ? 'bg-emerald-600 text-white shadow-lg' : step === s.id ? 'bg-indigo-700 text-white scale-110 shadow-2xl' : 'bg-slate-800 border border-white/10 text-slate-500'}`}>
                        {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black italic text-lg tracking-tighter">{s.id}</span>}
                    </div>
                    <span className={`text-xs sm:text-[10px] font-black uppercase tracking-[0.2em] ${step === s.id ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
                </div>
                {idx < STEPS_DATA.length - 1 && (
                    <div className="flex-1 h-0.5 bg-slate-800 mx-2 -mt-10 relative overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: step > s.id ? '100%' : '0%' }} />
                    </div>
                )}
            </React.Fragment>
        ))}
    </div>
);

export default ContractStepTracker;
