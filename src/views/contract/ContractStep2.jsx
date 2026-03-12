import React from "react";
import HoldButton from "../../components/ui/HoldButton";
import { Lock, UploadCloud, Timer, AlertTriangle } from "lucide-react";
import { parseDeadlineLocal } from "../../lib/utils";

const ContractStep2 = ({
    mode,
    deliverables,
    isUploading, uploadProgress,
    uploadMessage, setUploadMessage,
    uploadFile, setUploadFile,
    escrowDesc, escrowActionLabel,
    autoReleaseFired,
    contractDeadline,
    handleNextStep, status,
    handleReDelivery
}) => {
    const isHirer = mode === 'hirer';

    return (
        <>
            {autoReleaseFired && (
                <div className="flex items-center gap-3 bg-rose-900/30 border border-rose-500/30 rounded-2xl px-5 py-4 text-rose-300 text-sm font-bold max-w-md mx-auto mb-4 animate-fade-in-up">
                    <Timer className="w-5 h-5 shrink-0" />
                    <div>Auto-Release triggered. Deadline passed with no delivery. Funds have been released. Both parties notified.</div>
                </div>
            )}
            {contractDeadline && new Date() > parseDeadlineLocal(contractDeadline) && (
                <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-500/30 rounded-2xl px-5 py-3 text-amber-300 text-sm font-bold max-w-md mx-auto mb-4">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Deadline passed: {parseDeadlineLocal(contractDeadline).toLocaleDateString()}. Consider renegotiating.
                </div>
            )}
            <div className="space-y-10 animate-fade-in-up">
                <div className="w-32 h-32 bg-indigo-500/10 rounded-[48px] flex items-center justify-center border border-indigo-500/20 rotate-12 mx-auto">
                    <Lock className="w-14 h-14 text-indigo-400 -rotate-12" />
                </div>
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Vault Secured</h2>
                <p className="text-slate-400 text-lg mb-6">{escrowDesc}</p>
                {isHirer ? (
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="border-4 border-dashed border-white/10 rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 bg-slate-900/30">
                            <h3 className="text-xl font-black text-white">{deliverables.length === 0 ? 'Awaiting Provider Upload' : 'Deliverables Submitted'}</h3>
                            {deliverables.length > 0 && (
                                <ul className="mb-2 w-full text-left">
                                    {deliverables.map((d, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                                            <span className="font-bold">Version {d.version}:</span>
                                            <span>{d.message}</span>
                                            <span className="text-slate-500">({new Date(d.timestamp).toLocaleString()})</span>
                                            <a href={d.fileUrl} download className="ml-2 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-emerald-500 transition-colors">Download</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{deliverables.length === 0 ? 'You will be notified when files are submitted.' : 'You can download submitted files.'}</p>
                        <HoldButton key="btn-2" onClick={handleNextStep} label={escrowActionLabel} className="btn-primary-hold w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} />
                    </div>
                ) : isUploading ? (
                    <div className="space-y-8 max-w-md mx-auto">
                        <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
                                <circle cx="64" cy="64" r="50" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 - (314 * uploadProgress / 100)} strokeLinecap="round" className="transition-all duration-100" />
                            </svg>
                            <span className="absolute text-2xl font-black text-white">{uploadProgress}%</span>
                        </div>
                        <p className="text-indigo-400 font-black tracking-widest uppercase animate-pulse">Uploading...</p>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto space-y-4">
                        <form
                            className="border-4 border-dashed border-white/10 rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 bg-slate-900/30 w-full"
                            onSubmit={e => {
                                e.preventDefault();
                                if (!uploadFile) return;
                                handleReDelivery(uploadFile, uploadMessage);
                                setUploadFile(null);
                                setUploadMessage("");
                            }}
                        >
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-8 h-8 text-indigo-400" />
                            </div>
                            <input
                                type="file"
                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                onChange={e => setUploadFile(e.target.files[0])}
                                required
                            />
                            <input
                                type="text"
                                className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700"
                                placeholder="Delivery message (required)"
                                value={uploadMessage}
                                onChange={e => setUploadMessage(e.target.value)}
                                required
                            />
                            <button type="submit" className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-emerald-500 transition-colors">Submit Deliverable</button>
                        </form>
                        {deliverables.length > 0 && (
                            <div className="w-full mt-4">
                                <h4 className="text-xs font-bold text-slate-400 mb-2">Previous Deliverables</h4>
                                <ul className="text-left">
                                    {deliverables.map((d, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                                            <span className="font-bold">Version {d.version}:</span>
                                            <span>{d.message}</span>
                                            <span className="text-slate-500">({new Date(d.timestamp).toLocaleString()})</span>
                                            <a href={d.fileUrl} download className="ml-2 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-emerald-500 transition-colors">Download</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {deliverables.length === 0 && (
                            <>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Or skip to next phase</p>
                                <HoldButton key="btn-2-skip" onClick={handleNextStep} label={escrowActionLabel} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl" color="indigo" disabled={status !== 'idle'} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ContractStep2;
