
import React from "react";
import { useContractWorkflow } from "../hooks/useContractWorkflow";
import { CheckCircle2, Lock, Scan, User, Star, ArrowRight, UploadCloud, Fingerprint, Heart } from "lucide-react";
import HoldButton from "../components/ui/HoldButton";

// Ensure animation always appears when step 5 is rendered
// (moved below inside component)

const STEPS_DATA = [
    { id: 1, label: 'PROTOCOL' },
    { id: 2, label: 'ESCROW' },
    { id: 3, label: 'INSPECT' },
    { id: 4, label: 'RATING' }
];



const ContractView = (props) => {
    // Payment delay simulation state
    const [showPaymentDelay, setShowPaymentDelay] = React.useState(false);
    const [paymentDelayed, setPaymentDelayed] = React.useState(false);
    // Cancel feature state
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState("");
    const [isCancelled, setIsCancelled] = React.useState(false);
    // Renegotiation state
    const [showRenegotiate, setShowRenegotiate] = React.useState(false);
    const [renegotiationFields, setRenegotiationFields] = React.useState({ deadline: '', amount: '', scope: '' });
    const [isRenegotiating, setIsRenegotiating] = React.useState(false);
    const [pendingRenegotiation, setPendingRenegotiation] = React.useState(null);
    const {
        step, handleNextStep, handleReject, isUploading, uploadProgress, handleFileUpload, status, formatNumber, userStats, setUserStats, addToast, triggerLevelUp, triggerParamUp, mode
    } = props;
    // Use custom hook for all workflow state/logic
    const workflow = useContractWorkflow({
        step, setUserStats, userStats, addToast, triggerLevelUp, triggerParamUp, mode, handleNextStep, handleReject, status
    });
    // Destructure all state/handlers from hook for use in UI
    const {
        rating, setRating, hasUpdatedStats, deliverables, setDeliverables,
        uploadMessage, setUploadMessage, uploadFile, setUploadFile,
        showRejectModal, setShowRejectModal, rejectReason, setRejectReason,
        history, setHistory,
        showApproveConfirm, setShowApproveConfirm, approveTimeoutId, setApproveTimeoutId, pendingApprove, setPendingApprove,
        showRejectConfirm, setShowRejectConfirm, rejectTimeoutId, setRejectTimeoutId, pendingReject, setPendingReject,
        showDisputeConfirm, setShowDisputeConfirm, disputeSubmitted, setDisputeSubmitted
    } = workflow;
    // Handler for Dispute button
    const handleDisputeClick = () => {
        setShowDisputeConfirm(true);
    };

    // Handler for confirming Dispute (aggregate evidence and notify admin)
    const handleConfirmDispute = () => {
        setShowDisputeConfirm(false);
        setDisputeSubmitted(true);
        // Simulate evidence aggregation and admin notification
        if (addToast) addToast('Dispute Submitted', 'All evidence sent to admin/arbitrator.', 'warning');
        // Optionally, add to history
        setHistory(prev => [
            { type: 'dispute', message: 'Dispute raised. Evidence sent to admin.', timestamp: Date.now(), actor: mode },
            ...prev
        ]);
    };



    // Mode-specific UI helpers
    const isHirer = mode === 'hirer';
    const isEarner = mode === 'earner';

    // Mode-specific labels
    const escrowLabel = isHirer ? 'Awaiting Deliverables' : 'Upload Deliverables';
    const escrowDesc = isHirer ? 'Waiting for provider to submit files.' : 'Upload your work artifacts for client review.';
    const escrowActionLabel = isHirer ? 'Skip to Next Phase' : 'Enter Build Phase';
    const inspectLabel = isHirer ? 'Review Deliverables' : 'Neural Inspection';
    const inspectActionLabel = isHirer ? 'Approve & Release Funds' : 'Release Funds';
    const ratingLabel = isHirer ? 'Rate Provider' : 'Rate Experience';
    const settledLabel = isHirer ? 'Contract Settled. Provider Paid.' : 'Settled';


    // Handler for Reject button (with confirm dialog)
    const handleRejectClick = () => {
        setShowRejectConfirm(true);
    };

    // Handler for Approve button (with confirm dialog)
    const handleApproveClick = () => {
        setShowApproveConfirm(true);
        setPendingApprove(false); // Reset approve state when opening modal
    };

    // Confirm Approve with Undo (5s)
    const confirmApprove = () => {
        setPendingApprove(true);
        const timeout = setTimeout(() => {
            setPendingApprove(false);
            setShowApproveConfirm(false);
            if (handleNextStep) handleNextStep();
        }, 5000);
        setApproveTimeoutId(timeout);
    };
    const undoApprove = () => {
        if (approveTimeoutId) clearTimeout(approveTimeoutId);
        setPendingApprove(false);
        setShowApproveConfirm(false);
    };

    // Confirm Reject with Undo (5s)
    const confirmReject = () => {
        setPendingReject(true);
        const timeout = setTimeout(() => {
            setPendingReject(false);
            setShowRejectConfirm(false);
            setShowRejectModal(true); // show reason modal after confirm
        }, 5000);
        setRejectTimeoutId(timeout);
    };
    const undoReject = () => {
        if (rejectTimeoutId) clearTimeout(rejectTimeoutId);
        setPendingReject(false);
        setShowRejectConfirm(false);
    };

    // Handler for confirming rejection
    const handleConfirmReject = () => {
        if (!rejectReason.trim()) return;
        setHistory(prev => [
            { type: 'reject', message: rejectReason, timestamp: Date.now(), actor: isHirer ? 'hirer' : 'earner' },
            ...prev
        ]);
        setShowRejectModal(false);
        setRejectReason("");
        // Optionally, move to a REJECTED step or allow re-delivery
        if (addToast) addToast('Rejected', 'Re-delivery requested with reason.', 'warning');
        // For demo: allow re-delivery by going back to step 2
        if (handleReject) handleReject();
    };

    // Handler for re-delivery (file upload)
    const handleReDelivery = (file, message) => {
        const url = URL.createObjectURL(file);
        setDeliverables(prev => [
            ...prev,
            {
                version: prev.length + 1,
                fileUrl: url,
                message: message || `Deliverable v${prev.length + 1}`,
                timestamp: Date.now()
            }
        ]);
        setHistory(prev => [
            { type: 're-delivery', message: message || `Re-delivery v${deliverables.length + 1}`, timestamp: Date.now(), actor: isEarner ? 'earner' : 'hirer' },
            ...prev
        ]);
        if (addToast) addToast('Re-delivery', 'Deliverable re-submitted.', 'info');
    };

    // Step labels and badge helpers
    const stepLabels = [
        'Escrow Start',
        'Awaiting Delivery',
        'Review/Inspection',
        'Rating',
        'Complete'
    ];
    const stepBadges = [
        'ESCROW',
        deliverables.length === 0 ? 'NOT SUBMITTED' : 'SUBMITTED',
        history.find(h => h.type === 'reject') ? 'REVISION REQUESTED' : 'UNDER REVIEW',
        'RATING',
        'COMPLETE'
    ];
    const stepDescriptions = [
        'Funds are locked in escrow. Awaiting next action.',
        deliverables.length === 0 ? 'Provider must submit deliverables.' : 'Deliverables submitted. Awaiting review.',
        history.find(h => h.type === 'reject') ? 'Revision requested. Awaiting re-delivery.' : 'Review submitted deliverables.',
        'Rate your experience to finalize the contract.',
        'Contract is complete. All actions are recorded.'
    ];

    return (
    <div className="animate-fade-in-up space-y-16">
        <div className="mb-16 flex flex-wrap justify-between items-center max-w-2xl mx-auto relative px-1 sm:px-4 gap-2">
            {STEPS_DATA.map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center z-10">
                        <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 transition-all duration-700 ${step > s.id ? 'bg-emerald-600 text-white shadow-lg' : step === s.id ? 'bg-indigo-700 text-white scale-110 shadow-2xl' : 'bg-slate-800 border border-white/10 text-slate-500'}`}>{step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black italic text-lg tracking-tighter">{s.id}</span>}</div>
                        <span className={`text-xs sm:text-[10px] font-black uppercase tracking-[0.2em] ${step === s.id ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                    {idx < STEPS_DATA.length - 1 && (<div className="flex-1 h-0.5 bg-slate-800 mx-2 -mt-10 relative overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: step > s.id ? '100%' : '0%' }} /></div>)}
                </React.Fragment>
            ))}
        </div>


        <div className="max-w-4xl mx-auto bg-[#0f172a]/40 rounded-[24px] sm:rounded-[56px] p-2 sm:p-12 border border-white/[0.07] min-h-[500px] shadow-2xl backdrop-blur-2xl text-center">
            {/* Acceptance Protocol: show only Abort Sequence and Initiate Contract after negotiation, before contract initiation */}
            {((typeof step !== 'number' || step === 0) && !isCancelled) && (
                <div className="flex flex-col items-center justify-center mt-12 mb-6 gap-8">
                    <div className="mb-4">
                        <h2 className="text-3xl font-black text-white mb-2">Acceptance Protocol</h2>
                        <p className="text-slate-400 text-lg">Review the Definition of Done (DoD) and contract terms below. If you do not agree, you may abort and return to negotiation. If you agree, initiate the contract to lock terms.</p>
                        <ul className="mt-4 text-left text-slate-200 text-base font-bold bg-slate-800/60 rounded-xl p-4 max-w-md mx-auto">
                            <li>Definitive Figma Library</li>
                            <li>Dark Mode Tokens</li>
                            <li>Atomic Design Compliance</li>
                        </ul>
                    </div>
                    <div className="flex justify-center gap-6">
                        <button onClick={() => setShowCancelConfirm(true)}
                            className="flex items-center min-w-[140px] max-w-[200px] px-6 py-3 rounded-full bg-pink-600 text-white font-black hover:bg-pink-700 shadow-xl text-base border border-pink-200"
                            style={{ boxShadow: '0 2px 8px 0 rgba(255, 0, 90, 0.10)' }}
                            title="Abort Sequence">
                            Abort Sequence
                        </button>
                        <HoldButton key="btn-initiate" onClick={handleNextStep} label="Initiate Contract" icon={ArrowRight} className="btn-primary-hold min-w-[140px] max-w-[200px] bg-white text-[#020617] py-3 rounded-full font-black text-base shadow-xl border border-white/20" disabled={status !== 'idle'} />
                    </div>
                </div>
            )}
            {/* Renegotiation Modal: Instant Preview + One-Click Send UX */}
            {showRenegotiate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) setShowRenegotiate(false); }}>
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6 relative flex flex-col">
                        <button aria-label="Close" onClick={() => setShowRenegotiate(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold focus:outline-none">×</button>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Renegotiate Terms</h3>
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Current Terms */}
                            <div className="flex-1 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                <h4 className="text-sm font-bold text-slate-300 mb-2">Current Terms</h4>
                                <div className="text-xs text-slate-400 mb-1">Deadline: <span className="font-bold text-white">{pendingRenegotiation?.deadline || '—'}</span></div>
                                <div className="text-xs text-slate-400 mb-1">Amount: <span className="font-bold text-white">{pendingRenegotiation?.amount || '—'}</span></div>
                                <div className="text-xs text-slate-400">Scope: <span className="font-bold text-white">{pendingRenegotiation?.scope || '—'}</span></div>
                            </div>
                            {/* New Terms (Editable) */}
                            <div className="flex-1 bg-slate-800/60 rounded-xl p-4 border border-yellow-700">
                                <h4 className="text-sm font-bold text-yellow-300 mb-2">New Terms (Editable)</h4>
                                <input type="text" className="w-full rounded px-3 py-2 text-sm bg-slate-900 text-white border border-slate-700 mb-2" placeholder="New Deadline (optional)" value={renegotiationFields.deadline} onChange={e => setRenegotiationFields(f => ({ ...f, deadline: e.target.value }))} />
                                <input type="text" className="w-full rounded px-3 py-2 text-sm bg-slate-900 text-white border border-slate-700 mb-2" placeholder="New Amount (optional)" value={renegotiationFields.amount} onChange={e => setRenegotiationFields(f => ({ ...f, amount: e.target.value }))} />
                                <textarea className="w-full rounded px-3 py-2 text-sm bg-slate-900 text-white border border-slate-700" placeholder="Scope/Terms Change (optional)" value={renegotiationFields.scope} onChange={e => setRenegotiationFields(f => ({ ...f, scope: e.target.value }))} rows={3} />
                            </div>
                        </div>
                        <div className="flex flex-col items-center mt-4">
                            <button onClick={() => {
                                setIsRenegotiating(true);
                                setShowRenegotiate(false);
                                setPendingRenegotiation({ ...renegotiationFields, proposer: mode, timestamp: Date.now() });
                                setHistory(prev => [
                                    { type: 'renegotiation-proposed', message: `Proposed changes: ${JSON.stringify(renegotiationFields)}`, timestamp: Date.now(), actor: mode },
                                    ...prev
                                ]);
                                if (addToast) addToast('Renegotiation Proposed', 'Awaiting other party response.', 'info');
                            }} className="px-6 py-3 rounded bg-yellow-600 text-white font-bold text-lg hover:bg-yellow-700 transition-all w-full max-w-xs">Send Proposal</button>
                            <span className="text-xs text-slate-500 mt-2">Changes will not be saved unless you send.<br/>Click × or outside to close without saving.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Renegotiation Banner/Lockout */}
            {isRenegotiating && pendingRenegotiation && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-900/80 border border-yellow-400 text-yellow-100 flex flex-col items-center">
                    <div className="font-bold mb-2">Renegotiation in Progress</div>
                    <div className="text-xs mb-2">Proposed by: {pendingRenegotiation.proposer} at {new Date(pendingRenegotiation.timestamp).toLocaleString()}</div>
                    <div className="text-xs">Deadline: {pendingRenegotiation.deadline || '—'} | Amount: {pendingRenegotiation.amount || '—'}<br/>Scope: {pendingRenegotiation.scope || '—'}</div>
                    {/* Accept/Reject buttons will be added in next step */}
                </div>
            )}
            {/* Cancel Confirmation Dialog */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">Cancel Contract</h3>
                        <textarea className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700" placeholder="Enter cancellation reason (required)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} required rows={4} />
                        <div className="flex gap-4 justify-end">
                            <button onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                            <button onClick={() => { if (cancelReason.trim()) { setIsCancelled(true); setShowCancelConfirm(false); setHistory(prev => [{ type: 'cancel', message: cancelReason, timestamp: Date.now(), actor: mode }, ...prev]); if (addToast) addToast('Contract Cancelled', 'Contract cancelled: ' + cancelReason, 'error'); }}} className="px-4 py-2 rounded bg-red-600 text-white font-bold disabled:opacity-50" disabled={!cancelReason.trim()}>Confirm Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {isCancelled ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <h2 className="text-4xl font-black text-red-500 mb-4">Contract Cancelled</h2>
                    <p className="text-slate-400 mb-6">Reason: {cancelReason}</p>
                    <button onClick={handleNextStep} className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/10 text-white font-bold transition-all">Return to Feed</button>
                </div>
            ) : (
                <>
                    {step === 1 && (
                        <div className="space-y-10 animate-fade-in-up">
                            <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white leading-none">Commitment Locked</h2>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">Funds are moving to the decentralized vault.<br/> This action is immutable.</p>
                            <HoldButton key="btn-1" onClick={handleNextStep} label="Activate Trust Stream" icon={ArrowRight} className="btn-primary-hold w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-2xl" disabled={status !== 'idle'} />
                        </div>
                    )}
                    {step === 2 && (
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
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{deliverables.length === 0 ? 'You will be notified when files are submitted.' : 'You can download submitted files.'}</p>
                                    <HoldButton key="btn-2" onClick={handleNextStep} label={escrowActionLabel} className="btn-primary-hold w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} />
                                </div>
                            ) : (
                                isUploading ? (
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
                                        <form className="border-4 border-dashed border-white/10 rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 bg-slate-900/30 w-full" onSubmit={e => {
                                            e.preventDefault();
                                            if (!uploadFile) return;
                                            handleReDelivery(uploadFile, uploadMessage);
                                            setUploadFile(null);
                                            setUploadMessage("");
                                        }}>
                                            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <input type="file" className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={e => setUploadFile(e.target.files[0])} required />
                                            <input type="text" className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700" placeholder="Delivery message (required)" value={uploadMessage} onChange={e => setUploadMessage(e.target.value)} required />
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
                                                <HoldButton key="btn-2" onClick={handleNextStep} label={escrowActionLabel} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl" color="indigo" disabled={status !== 'idle'} />
                                            </>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                    {/* ...repeat for step === 3, step === 4, step === 5 as in original code... */}
                </>
            )}

            {step === 3 && (
                <div className="space-y-10 animate-fade-in-up">
                    <div className="w-32 h-32 bg-amber-500/10 rounded-[48px] flex items-center justify-center border border-amber-500/20 mx-auto animate-pulse">
                        <Scan className="w-14 h-14 text-amber-500" />
                    </div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter">{inspectLabel}</h2>
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 max-w-md mx-auto">
                        <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> 98.2% Match Verified</p>
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
                        <HoldButton key={`btn-3-${showApproveConfirm ? 'modal' : 'main'}`} holdKey={`${step}-${showApproveConfirm}-${pendingApprove}`} onClick={handleApproveClick} label={inspectActionLabel} className="btn-primary-hold flex-[2] bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle' || pendingApprove} />
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
                                                    {/* Dispute Submitted Dialog (optional) */}
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
                                                            <button onClick={undoApprove} className="px-4 py-2 rounded bg-yellow-500 text-black font-bold">Undo</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-4 justify-end">
                                                            <button onClick={() => { setShowApproveConfirm(false); setPendingApprove(false); }} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                                                            <button onClick={confirmApprove} className="px-4 py-2 rounded bg-emerald-600 text-white font-bold">Confirm Approve</button>
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
                                        <textarea className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700" placeholder="Enter rejection reason (required)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required rows={4} />
                                        <div className="flex gap-4 justify-end">
                                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                                            <button onClick={handleConfirmReject} className="px-4 py-2 rounded bg-red-600 text-white font-bold disabled:opacity-50" disabled={!rejectReason.trim()}>Confirm Reject</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Always show History Panel */}
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
                                            <span className={`font-bold uppercase px-2 py-1 rounded ${h.type==='reject' ? 'bg-red-800/80 text-red-200' : h.type==='re-delivery' ? 'bg-yellow-800/80 text-yellow-100' : h.type==='dispute' ? 'bg-red-700/80 text-white' : 'bg-slate-700/80 text-slate-100'}`}>{h.type}</span>
                                            <span className="break-all">{h.message}</span>
                                            <span className="text-slate-400">({new Date(h.timestamp).toLocaleString()})</span>
                                            <span className="text-slate-500">[{h.actor}]</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                </div>
            )}
            {step === 4 && (
                <div className="space-y-12 animate-fade-in-up">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden">
                                <User className="w-12 h-12 text-slate-300" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white mb-2">{ratingLabel}</h2>
                            <p className="text-slate-400">Feedback updates the Neural Trust Score.</p>
                        </div>
                        <div className="flex gap-4">{[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className="group focus:outline-none transition-transform active:scale-90">
                                <Star className={`w-10 h-10 transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                            </button>
                        ))}</div>
                    </div>
                    {/* Simulate Payment Delay button (only if not already delayed or cancelled) */}
                    {!paymentDelayed && !isCancelled && (
                        <div className="flex justify-center mt-4">
                            <button onClick={() => setShowPaymentDelay(true)} className="px-4 py-2 rounded bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition-all text-sm">Simulate Payment Delay</button>
                        </div>
                    )}
                    {rating > 0 ? (
                        <div className="animate-fade-in-up">
                            <HoldButton key="btn-4" onClick={handleNextStep} label="Commit & Close" className="btn-primary-hold w-full max-w-md mx-auto bg-white text-[#020617] py-6 rounded-[32px] font-black text-xl shadow-xl" disabled={status !== 'idle'} />
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Select stars to finalize</p>
                    )}
                </div>
            )}
            {step === 5 && (
                <div className="relative flex flex-col items-center justify-center min-h-[300px]">
                    {/* Minimal Settled UI */}
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase mb-8">{settledLabel}</h2>
                    <button onClick={handleNextStep} className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/10 text-white font-bold transition-all">Return to Feed</button>
                </div>
            )}

        </div>
    </div>
    );
};

export default ContractView;
