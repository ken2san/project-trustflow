import React from "react";
import { RefreshCw, Download, ShieldCheck } from "lucide-react";
import { downloadAuditTrail } from "../../lib/auditExport.js";

const ContractStep5 = ({ settledLabel, handleNextStep, onRehire, contractEvents, dodHash, contractId }) => {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await downloadAuditTrail({
                contractId: contractId ?? 'unknown',
                dodHash: dodHash ?? null,
                events: contractEvents ?? [],
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
    <div className="relative flex flex-col items-center justify-center min-h-[300px] gap-4">
        <h2 className="text-4xl font-black text-white tracking-tight uppercase mb-6">{settledLabel}</h2>

        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg"
        >
            {isExporting
                ? <><ShieldCheck className="w-4 h-4 animate-pulse" />Verifying…</>
                : <><Download className="w-4 h-4" />Download Audit Trail</>
            }
        </button>
        <p className="text-xs text-slate-500 -mt-2">SHA-256 · RFC 3161 · Tamper-evident JSON</p>

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
};

export default ContractStep5;
