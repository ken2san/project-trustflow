import { useState, useEffect } from "react";

/**
 * Custom hook to encapsulate contract workflow state and logic.
 * Handles deliverables, history, modals, rating, and workflow actions.
 */
export function useContractWorkflow({
  step,
  mode,
  handleNextStep,
  handleReject,
  status
}) {
  // Core state
  const [rating, setRating] = useState(0);

  // Reset per-contract state when a new contract starts
  useEffect(() => {
    if (step === 1) {
      setRating(0);
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

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (approveTimeoutId) clearTimeout(approveTimeoutId);
      if (rejectTimeoutId) clearTimeout(rejectTimeoutId);
    };
    // eslint-disable-next-line
  }, [approveTimeoutId, rejectTimeoutId]);

  return {
    rating, setRating, deliverables, setDeliverables,
    uploadMessage, setUploadMessage, uploadFile, setUploadFile,
    showRejectModal, setShowRejectModal, rejectReason, setRejectReason,
    history, setHistory,
    showApproveConfirm, setShowApproveConfirm, approveTimeoutId, setApproveTimeoutId, pendingApprove, setPendingApprove,
    showRejectConfirm, setShowRejectConfirm, rejectTimeoutId, setRejectTimeoutId, pendingReject, setPendingReject,
    showDisputeConfirm, setShowDisputeConfirm, disputeSubmitted, setDisputeSubmitted
  };
}
