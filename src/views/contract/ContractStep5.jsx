import React from "react";
import { RefreshCw } from "lucide-react";

const ContractStep5 = ({ settledLabel, handleNextStep, onRehire }) => (
    <div className="relative flex flex-col items-center justify-center min-h-[300px] gap-4">
        <h2 className="text-4xl font-black text-white tracking-tight uppercase mb-6">{settledLabel}</h2>
        {onRehire && (
            <button
                onClick={onRehire}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg"
            >
                <RefreshCw className="w-4 h-4" />
                Re-hire / Use as Template
            </button>
        )}
        <button
            onClick={handleNextStep}
            className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
        >
            Return to Feed
        </button>
    </div>
);

export default ContractStep5;
