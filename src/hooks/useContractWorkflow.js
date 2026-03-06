import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to encapsulate contract workflow state and logic.
 * Handles deliverables, history, modals, rating, and workflow actions.
 */
export function useContractWorkflow({
  step,
  setUserStats,
  userStats,
  addToast,
  triggerLevelUp,
  triggerParamUp,
  mode,
  handleNextStep,
  handleReject,
  status
}) {
  // Ref for level-up flag to avoid global window pollution
  const lastLeveledUpRef = useRef(false);

  // Core state
  const [rating, setRating] = useState(0);
  const [hasUpdatedStats, setHasUpdatedStats] = useState(false);

  // Reset per-contract state when a new contract starts
  useEffect(() => {
    if (step === 1) {
      setRating(0);
      setHasUpdatedStats(false);
      lastLeveledUpRef.current = false;
    }
  }, [step]);
  const [deliverables, setDeliverables] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [history, setHistory] = useState([]);

  // Approve/Reject/Dispute dialog state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approveTimeoutId, setApproveTimeoutId] = useState(null);
  const [pendingApprove, setPendingApprove] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectTimeoutId, setRejectTimeoutId] = useState(null);
  const [pendingReject, setPendingReject] = useState(false);
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  // Stats update effect (copied from ContractView)
  useEffect(() => {
    if (step === 5 && setUserStats && userStats && !hasUpdatedStats) {
      setUserStats(prev => {
        const newCompleted = (prev.completedContracts || 0) + 1;
        const newExp = (prev.exp || 0) + 50 + (rating * 10);
        const newAvgRating = prev.completedContracts
          ? ((prev.avgRating * prev.completedContracts + (rating || prev.avgRating)) / newCompleted)
          : (rating || prev.avgRating);
        const expForNextLevel = 50;
        const leveledUp = Math.floor(newExp / expForNextLevel) > Math.floor((prev.exp || 0) / expForNextLevel);
        lastLeveledUpRef.current = leveledUp;
        return {
          ...prev,
          exp: newExp,
          level: prev.level + (leveledUp ? 1 : 0),
          completedContracts: newCompleted,
          avgRating: rating > 0 ? parseFloat(newAvgRating.toFixed(2)) : prev.avgRating,
          recentHistory: [
            { type: 'contract', rating, date: new Date().toISOString() },
            ...(prev.recentHistory || [])
          ].slice(0, 10)
        };
      });
      setHasUpdatedStats(true);
    }
    // eslint-disable-next-line
  }, [step, rating, setUserStats, userStats, hasUpdatedStats]);

  useEffect(() => {
    if (step === 5 && hasUpdatedStats) {
      const leveledUp = lastLeveledUpRef.current;
      const currentLevel = userStats?.level ?? 0;
      setTimeout(() => {
        if (leveledUp) {
          if (triggerLevelUp) triggerLevelUp();
          if (addToast) addToast('Level Up!', `You reached level ${currentLevel + 1}.`, 'success');
        } else {
          if (triggerParamUp) triggerParamUp();
          if (addToast) addToast('Profile Updated', 'Your Trust Score has been updated.', 'info');
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [step, hasUpdatedStats, userStats?.level]);

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (approveTimeoutId) clearTimeout(approveTimeoutId);
      if (rejectTimeoutId) clearTimeout(rejectTimeoutId);
    };
    // eslint-disable-next-line
  }, [approveTimeoutId, rejectTimeoutId]);

  return {
    rating, setRating, hasUpdatedStats, deliverables, setDeliverables,
    uploadMessage, setUploadMessage, uploadFile, setUploadFile,
    showRejectModal, setShowRejectModal, rejectReason, setRejectReason,
    history, setHistory,
    showApproveConfirm, setShowApproveConfirm, approveTimeoutId, setApproveTimeoutId, pendingApprove, setPendingApprove,
    showRejectConfirm, setShowRejectConfirm, rejectTimeoutId, setRejectTimeoutId, pendingReject, setPendingReject,
    showDisputeConfirm, setShowDisputeConfirm, disputeSubmitted, setDisputeSubmitted
  };
}
