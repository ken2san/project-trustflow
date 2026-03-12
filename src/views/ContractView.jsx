import React from "react";
import { useContractWorkflow } from "../hooks/useContractWorkflow";
import { Heart, Pause, Play, ArrowRight, Hash, ShieldCheck } from "lucide-react";
import HoldButton from "../components/ui/HoldButton";
import { parseDeadlineLocal } from "../lib/utils";
import ContractStepTracker from "./contract/ContractStepTracker";
import ContractStep1 from "./contract/ContractStep1";
import ContractStep2 from "./contract/ContractStep2";
import ContractStep3 from "./contract/ContractStep3";
import ContractStep4 from "./contract/ContractStep4";
import ContractStep5 from "./contract/ContractStep5";

const ContractView = (props) => {
    const [showPaymentDelay, setShowPaymentDelay] = React.useState(false);
    const [paymentDelayed, setPaymentDelayed] = React.useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState("");
    const [isCancelled, setIsCancelled] = React.useState(false);
    const [chatLocked, setChatLocked] = React.useState(false);
    const stepFromProps = typeof props.step === 'number' ? props.step : 0;
    const [currentStep, setCurrentStep] = React.useState(stepFromProps);
    const [showRenegotiate, setShowRenegotiate] = React.useState(false);
    const [renegotiationFields, setRenegotiationFields] = React.useState({ deadline: '', amount: '', scope: '' });
    const [isRenegotiating, setIsRenegotiating] = React.useState(false);
    const [pendingRenegotiation, setPendingRenegotiation] = React.useState(null);
    const [contractDeadline, setContractDeadline] = React.useState('');
    const [blindRatingSubmitted, setBlindRatingSubmitted] = React.useState(false);
    const [ratingsRevealed, setRatingsRevealed] = React.useState(false);
    const [partnerRating, setPartnerRating] = React.useState(null);
    const [mutualStakeEnabled, setMutualStakeEnabled] = React.useState(false);
    const [mutualStakeAmount, setMutualStakeAmount] = React.useState('');
    const [hirerStakeAmount, setHirerStakeAmount] = React.useState('');
    const [autoReleaseArmed, setAutoReleaseArmed] = React.useState(false);
    const [autoReleaseFired, setAutoReleaseFired] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    const [milestonesEnabled, setMilestonesEnabled] = React.useState(false);
    const [milestones, setMilestones] = React.useState([]);
    const [currentMilestoneIndex, setCurrentMilestoneIndex] = React.useState(0);
    const [stagedDeliveryEnabled, setStagedDeliveryEnabled] = React.useState(false);
    const [stagedPhase, setStagedPhase] = React.useState('preview');
    const [previewSubmitted, setPreviewSubmitted] = React.useState(false); // eslint-disable-line no-unused-vars

    const {
        step, handleNextStep, handleReject, isUploading, uploadProgress, handleFileUpload, status,
        formatNumber, userStats, setUserStats, addToast, triggerLevelUp, triggerParamUp, mode,
        dodHash, contractEvents
    } = props;

    const workflow = useContractWorkflow({
        step, setUserStats, userStats, addToast, triggerLevelUp, triggerParamUp, mode, handleNextStep, handleReject, status
    });

    const {
        rating, setRating, hasUpdatedStats, deliverables, setDeliverables,
        uploadMessage, setUploadMessage, uploadFile, setUploadFile,
        showRejectModal, setShowRejectModal, rejectReason, setRejectReason,
        history, setHistory,
        showApproveConfirm, setShowApproveConfirm, approveTimeoutId, setApproveTimeoutId, pendingApprove, setPendingApprove,
        showRejectConfirm, setShowRejectConfirm, rejectTimeoutId, setRejectTimeoutId, pendingReject, setPendingReject,
        showDisputeConfirm, setShowDisputeConfirm, disputeSubmitted, setDisputeSubmitted
    } = workflow;

    const onApproveMilestone = React.useCallback(() => {
        const label = milestones[currentMilestoneIndex]?.name || `Milestone ${currentMilestoneIndex + 1}`;
        setCurrentMilestoneIndex(i => i + 1);
        if (addToast) addToast(`${label} Approved`, 'Payment for this stage released.', 'success');
    }, [milestones, currentMilestoneIndex, addToast]);

    const onAdvanceToFull = React.useCallback(() => {
        setStagedPhase('full');
        setPreviewSubmitted(false);
        if (addToast) addToast('Preview Approved', 'Earner can now submit final delivery.', 'success');
    }, [addToast]);

    const healthScore = React.useMemo(() => {
        let score = 100;
        (history || []).forEach(h => {
            if (h.type === 'reject') score -= 15;
            if (h.type === 're-delivery') score -= 5;
            if (h.type === 'dispute') score -= 30;
            if (h.type === 'renegotiation-proposed') score -= 10;
        });
        if (contractDeadline) {
            const d = parseDeadlineLocal(contractDeadline);
            if (new Date() > d) score -= 20;
        }
        if (autoReleaseFired) score -= 20;
        if (mutualStakeEnabled) score += 10;
        return Math.max(0, Math.min(100, score));
    }, [history, contractDeadline, autoReleaseFired, mutualStakeEnabled]);

    React.useEffect(() => {
        if (!autoReleaseArmed || autoReleaseFired || step !== 2 || !contractDeadline) return;
        const deadlineDate = parseDeadlineLocal(contractDeadline);
        if (new Date() >= deadlineDate) {
            const t = setTimeout(() => {
                setAutoReleaseFired(true);
                if (addToast) addToast('Auto-Release Triggered', 'Deadline passed with no delivery. Funds released to earner.', 'warning');
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [step, autoReleaseArmed, autoReleaseFired, contractDeadline, addToast]);

    const mutualStakeDeductedRef = React.useRef(false);
    React.useEffect(() => {
        if (mutualStakeEnabled && step === 2 && !mutualStakeDeductedRef.current) {
            const earnerStake = parseInt(mutualStakeAmount, 10) || 0;
            const hirerStake = parseInt(hirerStakeAmount, 10) || 0;
            if ((earnerStake > 0 || hirerStake > 0) && setUserStats) {
                setUserStats(s => ({ ...s, points: Math.max(0, (s.points ?? 0) - earnerStake) }));
                if (addToast) addToast(
                    'Mutual Stake Locked',
                    `Both parties staked: Earner ${earnerStake.toLocaleString()} PTS · Hirer ${hirerStake.toLocaleString()} PTS. Neither side can walk away without cost.`,
                    'info'
                );
                mutualStakeDeductedRef.current = true;
            }
        }
        if (step === 5 && mutualStakeDeductedRef.current) {
            const earnerStake = parseInt(mutualStakeAmount, 10) || 0;
            const hirerStake = parseInt(hirerStakeAmount, 10) || 0;
            if (setUserStats) {
                setUserStats(s => ({ ...s, points: (s.points ?? 0) + earnerStake }));
            }
            if (addToast) addToast(
                'Stakes Returned',
                `Earner +${earnerStake.toLocaleString()} PTS · Hirer +${hirerStake.toLocaleString()} PTS returned to both parties.`,
                'success'
            );
            mutualStakeDeductedRef.current = false;
        }
    // eslint-disable-next-line
    }, [step, mutualStakeEnabled, mutualStakeAmount, hirerStakeAmount]);

    const handleDisputeClick = () => setShowDisputeConfirm(true);

    const handleConfirmDispute = () => {
        setShowDisputeConfirm(false);
        setDisputeSubmitted(true);
        if (addToast) addToast('Dispute Submitted', 'All evidence sent to admin/arbitrator.', 'warning');
        setHistory(prev => [
            { type: 'dispute', message: 'Dispute raised. Evidence sent to admin.', timestamp: Date.now(), actor: mode },
            ...prev
        ]);
    };

    const handleBlindRatingSubmit = () => {
        if (rating === 0) return;
        setBlindRatingSubmitted(true);
        setTimeout(() => {
            setPartnerRating(Math.floor(Math.random() * 2) + 4);
            setRatingsRevealed(true);
        }, 3000);
    };

    const handleAbortSequence = () => {
        setIsCancelled(false);
        setShowCancelConfirm(false);
        setCancelReason("");
        setCurrentStep(0);
        setChatLocked(false);
        setHistory(prev => [
            { type: 'abort', message: 'Acceptance Protocol aborted. Returned to negotiation.', timestamp: Date.now(), actor: mode },
            ...prev
        ]);
        if (addToast) addToast('Aborted', 'Returned to negotiation phase.', 'info');
    };

    const handleRejectClick = () => setShowRejectConfirm(true);

    const handleApproveClick = () => {
        setShowApproveConfirm(true);
        setPendingApprove(false);
    };

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

    const confirmReject = () => {
        setPendingReject(true);
        const timeout = setTimeout(() => {
            setPendingReject(false);
            setShowRejectConfirm(false);
            setShowRejectModal(true);
        }, 5000);
        setRejectTimeoutId(timeout);
    };

    const undoReject = () => {
        if (rejectTimeoutId) clearTimeout(rejectTimeoutId);
        setPendingReject(false);
        setShowRejectConfirm(false);
    };

    const handleConfirmReject = () => {
        if (!rejectReason.trim()) return;
        setHistory(prev => [
            { type: 'reject', message: rejectReason, timestamp: Date.now(), actor: mode === 'hirer' ? 'hirer' : 'earner' },
            ...prev
        ]);
        setShowRejectModal(false);
        setRejectReason("");
        if (addToast) addToast('Rejected', 'Re-delivery requested with reason.', 'warning');
        if (handleReject) handleReject();
    };

    const handleReDelivery = (file, message) => {
        const url = URL.createObjectURL(file);
        setDeliverables(prev => [
            ...prev,
            { version: prev.length + 1, fileUrl: url, message: message || `Deliverable v${prev.length + 1}`, timestamp: Date.now() }
        ]);
        setHistory(prev => [
            { type: 're-delivery', message: message || `Re-delivery v${deliverables.length + 1}`, timestamp: Date.now(), actor: mode === 'earner' ? 'earner' : 'hirer' },
            ...prev
        ]);
        setShowApproveConfirm(false);
        setPendingApprove(false);
        setApproveTimeoutId(null);
        if (addToast) addToast('Re-delivery', 'Deliverable re-submitted.', 'info');
    };

    const isHirer = mode === 'hirer';
    const escrowDesc = isHirer ? 'Waiting for provider to submit files.' : 'Upload your work artifacts for client review.';
    const escrowActionLabel = isHirer ? 'Skip to Next Phase' : 'Enter Build Phase';
    const inspectLabel = isHirer ? 'Review Deliverables' : 'Neural Inspection';
    const inspectActionLabel = isHirer ? 'Approve & Release Funds' : 'Release Funds';
    const ratingLabel = isHirer ? 'Rate Provider' : 'Rate Experience';
    const settledLabel = isHirer ? 'Contract Settled. Provider Paid.' : 'Settled';

    return (
        <div className="animate-fade-in-up space-y-16">
            <ContractStepTracker step={step} />

            {step >= 1 && (
                <div className="flex items-center justify-between max-w-4xl mx-auto mb-2 px-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                        healthScore >= 80 ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                        : healthScore >= 50 ? 'bg-amber-900/30 border-amber-500/30 text-amber-400'
                        : 'bg-red-900/30 border-red-500/30 text-red-400'
                    }`}>
                        <Heart className="w-3.5 h-3.5" />
                        Health {healthScore}%
                    </div>
                    <button
                        onClick={() => {
                            setIsPaused(p => !p);
                            if (addToast) addToast(isPaused ? 'Contract Resumed' : 'Contract Paused', isPaused ? 'Actions unlocked.' : 'All actions suspended.', 'info');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                            isPaused ? 'bg-amber-600 border-amber-500 text-white' : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {isPaused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                    </button>
                </div>
            )}

            {dodHash && currentStep > 0 && (
                <div className="max-w-4xl mx-auto mb-2 px-2 flex justify-end">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">On Record</span>
                        <span className="text-[10px] font-mono text-emerald-500/70 ml-1">{dodHash.slice(0, 8)}…</span>
                        {contractEvents?.length > 0 && (
                            <span className="ml-1 text-[10px] text-emerald-500/50">{contractEvents.length} event{contractEvents.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                </div>
            )}
            <div className={`max-w-4xl mx-auto bg-[#0f172a]/40 rounded-[24px] sm:rounded-[56px] p-2 sm:p-12 border border-white/[0.07] min-h-[500px] shadow-2xl backdrop-blur-2xl text-center transition-opacity ${isPaused ? 'opacity-60 pointer-events-none' : ''}`}>
                {isPaused && (
                    <div className="flex items-center gap-4 bg-amber-900/30 border border-amber-500/30 rounded-2xl px-6 py-4 text-amber-300 mb-6 text-left">
                        <Pause className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-black text-sm">Contract Paused</p>
                            <p className="text-xs text-amber-400/70">All actions are suspended. Use the Resume button above to continue.</p>
                        </div>
                    </div>
                )}

                {((typeof currentStep !== 'number' || currentStep === 0) && !isCancelled) && (
                    <div className="flex flex-col items-center justify-center mt-12 mb-6 gap-8">
                        <div className="mb-4">
                            <h2 className="text-3xl font-black text-white mb-2">Acceptance Protocol</h2>
                            <p className="text-slate-400 text-lg">Review the Definition of Done below. Every item becomes an enforceable commitment, logged on the record. If you disagree, return to negotiation. If you agree, lock terms &#8212; and hold both sides accountable.</p>
                            <ul className="mt-4 text-left text-slate-200 text-base font-bold bg-slate-800/60 rounded-xl p-4 max-w-md mx-auto">
                                <li>Definitive Figma Library</li>
                                <li>Dark Mode Tokens</li>
                                <li>Atomic Design Compliance</li>
                            </ul>
                            {dodHash && (
                                <div className="mt-4 bg-slate-900/70 border border-emerald-500/20 rounded-xl p-4 max-w-md mx-auto text-left">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Contract Fingerprint</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-300 break-all leading-relaxed">{dodHash}</p>
                                    <p className="text-[10px] text-slate-500 mt-2">SHA-256 · Generated from DoD text · Immutable after initiation</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center gap-6">
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="flex items-center min-w-[140px] max-w-[200px] px-6 py-3 rounded-full bg-pink-600 text-white font-black hover:bg-pink-700 shadow-xl text-base border border-pink-200"
                                style={{ boxShadow: '0 2px 8px 0 rgba(255, 0, 90, 0.10)' }}
                            >
                                Decline &amp; Return
                            </button>
                            <HoldButton
                                key="btn-initiate"
                                onClick={() => { setCurrentStep(1); setChatLocked(true); handleNextStep && handleNextStep(); }}
                                label="Initiate Contract"
                                icon={ArrowRight}
                                className="btn-primary-hold min-w-[140px] max-w-[200px] bg-white text-[#020617] py-3 rounded-full font-black text-base shadow-xl border border-white/20"
                                disabled={status !== 'idle'}
                            />
                        </div>
                    </div>
                )}

                {showRenegotiate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) setShowRenegotiate(false); }}>
                        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6 relative flex flex-col">
                            <button aria-label="Close" onClick={() => setShowRenegotiate(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold focus:outline-none">&times;</button>
                            <h3 className="text-xl font-bold text-white mb-2 text-center">Renegotiate Terms</h3>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-1 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2">Current Terms</h4>
                                    <div className="text-xs text-slate-400 mb-1">Deadline: <span className="font-bold text-white">{pendingRenegotiation?.deadline || '\u2014'}</span></div>
                                    <div className="text-xs text-slate-400 mb-1">Amount: <span className="font-bold text-white">{pendingRenegotiation?.amount || '\u2014'}</span></div>
                                    <div className="text-xs text-slate-400">Scope: <span className="font-bold text-white">{pendingRenegotiation?.scope || '\u2014'}</span></div>
                                </div>
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
                                <span className="text-xs text-slate-500 mt-2">Changes will not be saved unless you send.<br/>Click &times; or outside to close without saving.</span>
                            </div>
                        </div>
                    </div>
                )}

                {isRenegotiating && pendingRenegotiation && (
                    <div className="mb-6 p-4 rounded-xl bg-yellow-900/80 border border-yellow-400 text-yellow-100 flex flex-col items-center">
                        <div className="font-bold mb-2">Renegotiation in Progress</div>
                        <div className="text-xs mb-2">Proposed by: {pendingRenegotiation.proposer} at {new Date(pendingRenegotiation.timestamp).toLocaleString()}</div>
                        <div className="text-xs">Deadline: {pendingRenegotiation.deadline || '\u2014'} | Amount: {pendingRenegotiation.amount || '\u2014'}<br/>Scope: {pendingRenegotiation.scope || '\u2014'}</div>
                    </div>
                )}

                {showCancelConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
                            <h3 className="text-xl font-bold text-white mb-2">Decline Contract</h3>
                            <textarea className="w-full rounded px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700" placeholder="Reason for declining (required)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} required rows={4} />
                            <div className="flex gap-4 justify-end">
                                <button onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }} className="px-4 py-2 rounded bg-slate-700 text-white font-bold">Cancel</button>
                                <button onClick={() => { if (cancelReason.trim()) handleAbortSequence(); }} className="px-4 py-2 rounded bg-red-600 text-white font-bold disabled:opacity-50" disabled={!cancelReason.trim()}>Confirm Decline</button>
                            </div>
                        </div>
                    </div>
                )}

                {!chatLocked && (
                    <>
                        {step === 1 && (
                            <ContractStep1
                                contractDeadline={contractDeadline}
                                setContractDeadline={setContractDeadline}
                                mutualStakeEnabled={mutualStakeEnabled}
                                setMutualStakeEnabled={setMutualStakeEnabled}
                                mutualStakeAmount={mutualStakeAmount}
                                setMutualStakeAmount={setMutualStakeAmount}
                                hirerStakeAmount={hirerStakeAmount}
                                setHirerStakeAmount={setHirerStakeAmount}
                                autoReleaseArmed={autoReleaseArmed}
                                setAutoReleaseArmed={setAutoReleaseArmed}
                                milestonesEnabled={milestonesEnabled}
                                setMilestonesEnabled={setMilestonesEnabled}
                                milestones={milestones}
                                setMilestones={setMilestones}
                                stagedDeliveryEnabled={stagedDeliveryEnabled}
                                setStagedDeliveryEnabled={setStagedDeliveryEnabled}
                                userLevel={userStats?.level ?? 1}
                                handleNextStep={handleNextStep}
                                status={status}
                            />
                        )}
                        {step === 2 && (
                            <ContractStep2
                                mode={mode}
                                deliverables={deliverables}
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                uploadMessage={uploadMessage}
                                setUploadMessage={setUploadMessage}
                                uploadFile={uploadFile}
                                setUploadFile={setUploadFile}
                                escrowDesc={escrowDesc}
                                escrowActionLabel={escrowActionLabel}
                                autoReleaseFired={autoReleaseFired}
                                contractDeadline={contractDeadline}
                                handleNextStep={handleNextStep}
                                status={status}
                                handleReDelivery={handleReDelivery}
                                milestonesEnabled={milestonesEnabled}
                                milestones={milestones}
                                currentMilestoneIndex={currentMilestoneIndex}
                                stagedDeliveryEnabled={stagedDeliveryEnabled}
                                stagedPhase={stagedPhase}
                                onAdvanceToFull={onAdvanceToFull}
                            />
                        )}
                    </>
                )}

                {step === 3 && (
                    <ContractStep3
                        mode={mode}
                        deliverables={deliverables}
                        history={history}
                        inspectLabel={inspectLabel}
                        inspectActionLabel={inspectActionLabel}
                        handleApproveClick={handleApproveClick}
                        handleRejectClick={handleRejectClick}
                        handleDisputeClick={handleDisputeClick}
                        handleConfirmReject={handleConfirmReject}
                        handleConfirmDispute={handleConfirmDispute}
                        confirmApprove={confirmApprove}
                        undoApprove={undoApprove}
                        confirmReject={confirmReject}
                        undoReject={undoReject}
                        showDisputeConfirm={showDisputeConfirm}
                        setShowDisputeConfirm={setShowDisputeConfirm}
                        disputeSubmitted={disputeSubmitted}
                        setDisputeSubmitted={setDisputeSubmitted}
                        showApproveConfirm={showApproveConfirm}
                        setShowApproveConfirm={setShowApproveConfirm}
                        pendingApprove={pendingApprove}
                        setPendingApprove={setPendingApprove}
                        showRejectConfirm={showRejectConfirm}
                        setShowRejectConfirm={setShowRejectConfirm}
                        pendingReject={pendingReject}
                        showRejectModal={showRejectModal}
                        setShowRejectModal={setShowRejectModal}
                        rejectReason={rejectReason}
                        setRejectReason={setRejectReason}
                        status={status}
                        milestonesEnabled={milestonesEnabled}
                        milestones={milestones}
                        currentMilestoneIndex={currentMilestoneIndex}
                        onApproveMilestone={onApproveMilestone}
                    />
                )}
                {step === 4 && (
                    <ContractStep4
                        rating={rating}
                        setRating={setRating}
                        blindRatingSubmitted={blindRatingSubmitted}
                        ratingsRevealed={ratingsRevealed}
                        partnerRating={partnerRating}
                        ratingLabel={ratingLabel}
                        handleBlindRatingSubmit={handleBlindRatingSubmit}
                        handleNextStep={handleNextStep}
                        status={status}
                        showPaymentDelay={showPaymentDelay}
                        setShowPaymentDelay={setShowPaymentDelay}
                        paymentDelayed={paymentDelayed}
                        isCancelled={isCancelled}
                    />
                )}
                {step === 5 && (
                    <ContractStep5
                        settledLabel={settledLabel}
                        handleNextStep={handleNextStep}
                        onRehire={props.onRehire}
                        contractEvents={contractEvents}
                        dodHash={dodHash}
                        contractId={props.contractId ?? 'contract'}
                    />
                )}
            </div>
        </div>
    );
};

export default ContractView;
