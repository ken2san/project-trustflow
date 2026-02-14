import { useState, useEffect } from "react";

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
  // Core state
  const [rating, setRating] = useState(0);
  const [hasUpdatedStats, setHasUpdatedStats] = useState(false);
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
        window.__lastLeveledUp = leveledUp;
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
      const leveledUp = window.__lastLeveledUp;
      setTimeout(() => {
        if (leveledUp) {
          if (triggerLevelUp) triggerLevelUp();
          if (addToast) addToast('Level Up!', `You reached level ${(userStats.level) + 1}.`, 'success');
        } else {
          if (triggerParamUp) triggerParamUp();
          if (addToast) addToast('Profile Updated', 'Your Trust Score has been updated.', 'info');
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [step, hasUpdatedStats]);

  // Handlers for workflow actions (upload, approve, reject, dispute, etc.)
  // ...existing code for handlers can be moved here in next steps...

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
