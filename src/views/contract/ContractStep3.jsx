import React from "react";
import HoldButton from "../../components/ui/HoldButton";
import { Scan, CheckCircle2 } from "lucide-react";

const ContractStep3 = ({
    mode,
    deliverables,
    history,
    inspectLabel, inspectActionLabel,
    handleApproveClick, handleRejectClick, handleDisputeClick,
    handleConfirmReject, handleConfirmDispute,
    confirmApprove, undoApprove,
    confirmReject, undoReject,
    showDisputeConfirm, setShowDisputeConfirm,
    disputeSubmitted, setDisputeSubmitted,
    showApproveConfirm, setShowApproveConfirm,
    pendingApprove, setPendingApprove,
    showRejectConfirm, setShowRejectConfirm,
    pendingReject,
    showRejectModal, setShowRejectModal,
    rejectReason, setRejectReason,
    status
}) => {
    const isHirer = mode === 'hirer';

    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="w-32 h-32 bg-amber-500/10 rounded-[48px] flex items-center justify-center border border-amber-500/20 mx-auto animate-pulse">
                <Scan className="w-14 h-14 text-amber-500" />
            </div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter">{inspectLabel}</h2>
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 max-w-md mx-auto">
                <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> 98.2% Match Verified
                </p>
                {isHirer && deliverables.length > 0 && (
                    <div className="mt-4 text-left">
                        <h4 className="text-xs font-bold text-slate-400 mb-2">Submitted Deliverables</h4>
                        <ul>
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
            </div>
            <div className="flex justify-center gap-4 max-w-md mx-auto">
                <button onClick={handleRejectClick} className="flex-1 py-6 rounded-[32px] border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white font-bold transition-all">Reject</button>
                <HoldButton
                    key={`btn-3-${showApproveConfirm ? 'modal' : 'main'}`}
                    holdKey={`3-${showApproveConfirm}-${pendingApprove}`}
                    onClick={handleApproveClick}
                    label={inspectActionLabel}
                    className="btn-primary-hold flex-[2] bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl"
                    disabled={status !== 'idle' || pendingApprove}
                />
                <button onClick={handleDisputeClick} className="flex-1 py-6 rounded-[32px] border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-white font-bold transition-all">Dispute</button>
            </div>

            {/* Dispute Confirmation Dialog */}
            {showDisputeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">Raise Dispute</h3>
                        <p className="text-slate-300">Are you sure you want to escalate this contract to admin/arbitrator? All files and history will be sent as evidence.</p>
                        <div className="flex gap-4 justify-end">
                            <button onClick={() => setShowDisputeConfirm(false)} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                            <button onClick={handleConfirmDispute} className="px-4 py-2 rounded bg-red-600 text-white font-bold">Confirm Dispute</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Submitted Confirmation */}
            {disputeSubmitted && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Dispute Submitted</h3>
                        <p className="text-slate-300 mb-4">All evidence has been sent to admin/arbitrator.<br/>You will be notified of the outcome.</p>
                        <button onClick={() => setDisputeSubmitted(false)} className="px-6 py-2 rounded bg-emerald-600 text-white font-bold">OK</button>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Dialog with Undo */}
            {showApproveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">Approve Deliverable</h3>
                        <p className="text-slate-300">Are you sure you want to approve and release funds?</p>
                        {pendingApprove ? (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-emerald-400 font-bold">Approved! You can undo for 5 seconds.</span>
                                <button onClick={undoApprove} className="px-4 py-2 rounded-full bg-yellow-400 text-indigo-900 font-bold border border-yellow-300/30 shadow hover:bg-yellow-300 transition-all">Undo</button>
                            </div>
                        ) : (
                            <div className="flex gap-4 justify-end mt-4">
                                <button onClick={() => { setShowApproveConfirm(false); setPendingApprove(false); }} className="px-4 py-2 rounded-full bg-indigo-900 text-indigo-300 font-bold border border-indigo-400/30 hover:bg-indigo-800 transition-all">Cancel</button>
                                <button onClick={confirmApprove} className="px-4 py-2 rounded-full bg-emerald-600 text-white font-bold border border-emerald-400/30 hover:bg-emerald-700 transition-all">Confirm Approve</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Confirmation Dialog with Undo */}
            {showRejectConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">Reject Deliverable</h3>
                        <p className="text-slate-300">Are you sure you want to reject and request re-delivery?</p>
                        {pendingReject ? (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-red-400 font-bold">Rejected! You can undo for 5 seconds.</span>
                                <button onClick={undoReject} className="px-4 py-2 rounded bg-yellow-500 text-black font-bold">Undo</button>
                            </div>
                        ) : (
                            <div className="flex gap-4 justify-end">
                                <button onClick={() => setShowRejectConfirm(false)} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                                <button onClick={confirmReject} className="px-4 py-2 rounded bg-red-600 text-white font-bold">Confirm Reject</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">Reject Deliverable</h3>
                        <textarea
                            className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700"
                            placeholder="Enter rejection reason (required)"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            required
                            rows={4}
                        />
                        <div className="flex gap-4 justify-end">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                            <button onClick={handleConfirmReject} className="px-4 py-2 rounded bg-red-600 text-white font-bold disabled:opacity-50" disabled={!rejectReason.trim()}>Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contract History Panel */}
            <div className="max-w-2xl mx-auto mt-6 sm:mt-10 bg-slate-800/70 rounded-xl sm:rounded-2xl p-2 sm:p-5 text-left overflow-x-auto">
                <h4 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">Contract History</h4>
                <ul className="space-y-1 sm:space-y-2">
                    {deliverables.map((d, i) => (
                        <li key={`d-${i}`} className="text-xs sm:text-sm text-indigo-200 flex flex-wrap gap-1 sm:gap-2 items-center py-1">
                            <span className="font-bold uppercase text-indigo-100 bg-indigo-800/70 px-2 py-1 rounded">DELIVERABLE</span>
                            <span className="break-all">Version {d.version}: {d.message}</span>
                            <span className="text-slate-400">({new Date(d.timestamp).toLocaleString()})</span>
                            <a href={d.fileUrl} download className="ml-2 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-emerald-500 transition-colors">Download</a>
                        </li>
                    ))}
                    {history.map((h, i) => (
                        <li key={`h-${i}`} className="text-xs sm:text-sm text-slate-200 flex flex-wrap gap-1 sm:gap-2 items-center py-1">
                            <span className={`font-bold uppercase px-2 py-1 rounded ${h.type === 'reject' ? 'bg-red-800/80 text-red-200' : h.type === 're-delivery' ? 'bg-yellow-800/80 text-yellow-100' : h.type === 'dispute' ? 'bg-red-700/80 text-white' : 'bg-slate-700/80 text-slate-100'}`}>{h.type}</span>
                            <span className="break-all">{h.message}</span>
                            <span className="text-slate-400">({new Date(h.timestamp).toLocaleString()})</span>
                            <span className="text-slate-500">[{h.actor}]</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ContractStep3;
