import React from "react";

const ContractStep5 = ({ settledLabel, handleNextStep }) => (
    <div className="relative flex flex-col items-center justify-center min-h-[300px]">
        <h2 className="text-4xl font-black text-white tracking-tight uppercase mb-8">{settledLabel}</h2>
        <button onClick={handleNextStep} className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/10 text-white font-bold transition-all">Return to Feed</button>
    </div>
);

export default ContractStep5;
