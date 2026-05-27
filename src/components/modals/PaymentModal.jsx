// filepath: src/components/modals/PaymentModal.jsx
// Stripe Escrow Payment Modal.
// Calls the `create-payment-intent` Edge Function, then uses Stripe Elements
// to collect card details and confirm the payment.
// Falls back to a "Test Mode" simulation when VITE_STRIPE_PUBLISHABLE_KEY is not set.

import React, { useState, useEffect } from "react";
import { Lock, X, CreditCard, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import ModalDialog from "../ui/ModalDialog";
import { getStripe, isStripeEnabled, createPaymentIntent, formatJpy } from "../../lib/stripe";
import HoldButton from "../ui/HoldButton";

// ── Inner form (rendered inside <Elements>) ──────────────────────────────────
const CheckoutForm = ({ amountJpy, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <PaymentElement />
      {errorMsg && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
      <HoldButton
        onClick={handlePay}
        label={submitting ? 'Processing…' : `Pay ${formatJpy(amountJpy)} — held in escrow`}
        icon={Lock}
        disabled={submitting || !stripe}
        className="w-full py-5 rounded-2xl shadow-xl"
        color="white"
      />
    </div>
  );
};

// ── Test-mode fallback (no Stripe key) ───────────────────────────────────────
const TestModeForm = ({ amountJpy, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleTestPay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess('pi_test_' + Math.random().toString(36).slice(2));
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-300/80 space-y-1">
        <p className="font-black">Test Mode</p>
        <p className="text-amber-400/60">Set <code className="text-amber-400 text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> in <code className="text-amber-400 text-xs">.env</code> to enable real payments. This button simulates a successful payment.</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Amount to be held in escrow</p>
        <p className="text-3xl font-black text-white">{formatJpy(amountJpy)}</p>
        <p className="text-xs text-slate-600 mt-2">Released to Earner only after you confirm delivery.</p>
      </div>
      <HoldButton
        onClick={handleTestPay}
        label={loading ? 'Simulating…' : `Simulate escrow payment`}
        icon={Lock}
        disabled={loading}
        className="w-full py-5 rounded-2xl shadow-xl"
        color="white"
      />
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────

/**
 * PaymentModal — Stripe escrow flow.
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onSuccess    (paymentIntentId: string) => void  — called after payment confirmed
 *   contractId   string
 *   amountJpy    number   — integer JPY (e.g. 300000)
 *   projectName  string
 */
const PaymentModal = ({ isOpen, onClose, onSuccess, contractId, amountJpy = 0, projectName = 'Contract' }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeInstance, setStripeInstance] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!isOpen || !isStripeEnabled || !contractId || clientSecret) return;

    (async () => {
      try {
        const stripe = await getStripe();
        setStripeInstance(stripe);
        const { clientSecret: cs } = await createPaymentIntent({ contractId, amountJpy, description: projectName });
        setClientSecret(cs);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [isOpen, contractId, amountJpy, projectName, clientSecret]);

  const handleSuccess = (paymentIntentId) => {
    setPaid(true);
    setTimeout(() => {
      setPaid(false);
      setClientSecret(null);
      onSuccess?.(paymentIntentId);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Secure Escrow Payment">
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex items-start gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <Lock className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-black text-white">{projectName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatJpy(amountJpy)} will be held by Stripe until you confirm delivery.
              Earner cannot access funds until you approve.
            </p>
          </div>
        </div>

        {paid ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <CheckCircle className="w-14 h-14 text-emerald-400" />
            <p className="font-black text-white text-lg">Payment secured</p>
            <p className="text-slate-500 text-sm">Funds held in escrow. Work can now begin.</p>
          </div>
        ) : loadError ? (
          <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {loadError}
          </div>
        ) : isStripeEnabled ? (
          clientSecret && stripeInstance ? (
            <Elements stripe={stripeInstance} options={{ clientSecret, appearance: { theme: 'night' } }}>
              <CheckoutForm amountJpy={amountJpy} onSuccess={handleSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold">Preparing secure payment…</span>
            </div>
          )
        ) : (
          <TestModeForm amountJpy={amountJpy} onSuccess={handleSuccess} />
        )}
      </div>
    </ModalDialog>
  );
};

export default PaymentModal;
