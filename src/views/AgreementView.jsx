// src/views/AgreementView.jsx
//
// One agreement, one action.
//
// This replaces the five-step contract flow for database-backed agreements. To
// say "I delivered", a performer previously had to pass through Secure Funds in
// Escrow, a TrustPoints tier gate, a simulated upload and a mutual rating form —
// escrow, staking and reputation standing between a person and the single thing
// they wanted to do. None of that is deleted; this simply does not route
// through it.
//
// The same screen serves both sides. Which action it offers comes from the
// protocol position plus which side the viewer is on, so the component holds no
// opinion about who is who — the server already decided that.
//
// WHAT THE WORDS MEAN
// "Mark as delivered" records that this party ASSERTED delivery at this time.
// It is not TrustFlow certifying that the work is complete or correct, and the
// record says so. Likewise "Request correction" records an objection; it does
// not rule that the objection is justified.

import React from 'react';
import { ArrowLeft, CheckCircle2, Send, Loader2, AlertTriangle, Download } from 'lucide-react';

/** Human wording for the attested event types, from the reader's side. */
const RECORD_LABELS = {
  'contract.initiated':    'Agreement created',
  'contract.accepted':     'Agreement confirmed',
  'dod.consent_recorded':  'Agreement confirmed',
  'performance.asserted':  'Marked delivered',
  'performance.accepted':  'Accepted',
  'performance.rejected':  'Correction requested',
  'contract.cancelled':    'Cancelled',
  'contract.completed':    'Closed',
  // Retired names, still present on older records.
  'work.submitted':        'Marked delivered',
  'work.approved':         'Accepted',
  'work.rejected':         'Correction requested',
};

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function Record({ events }) {
  if (!events?.length) {
    return <p className="text-sm text-slate-600">Nothing recorded yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {events.map(event => (
        <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="text-white font-bold">{RECORD_LABELS[event.type] ?? event.type}</span>
          <span className="text-[11px] font-mono text-slate-600">{formatWhen(event.created_at)}</span>
          <span className="text-xs text-slate-500">{event.actorLabel}</span>
          {event.reason && (
            <span className="w-full text-xs text-slate-500 pl-1">“{event.reason}”</span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function AgreementView({
  contract, events, viewerRole, busy, error,
  onAssertDelivery, onAccept, onRequestCorrection, onExport, onBack,
}) {
  const [correcting, setCorrecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState(null);

  if (!contract) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center text-slate-500 text-sm">
        <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /> Loading the agreement…
      </div>
    );
  }

  const state = contract.state;
  const performs = viewerRole === 'performer';
  const dod = Array.isArray(contract.dod) ? contract.dod : [];

  // Exactly one action is ever offered, and only to the side whose turn it is.
  // The other side is told what is being waited on rather than given a button
  // that would be refused.
  const canAssert = performs
    && (state === 'TERMS_ACCEPTED' || state === 'IN_PROGRESS');
  const canRespond = !performs && state === 'AWAITING_CONFIRMATION';
  const done = state === 'PERFORMANCE_ACCEPTED' || state === 'SETTLED';
  const cancelled = state === 'CANCELLED';

  const waitingText = cancelled ? 'This agreement was cancelled.'
    : done ? null
    : state === 'AWAITING_ACCEPTANCE' ? 'Waiting for the other party to confirm the terms.'
    : performs && state === 'AWAITING_CONFIRMATION' ? 'You marked this delivered. Waiting for their review.'
    : !performs && (state === 'TERMS_ACCEPTED' || state === 'IN_PROGRESS')
      ? 'Waiting for them to deliver.'
      : null;

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8 animate-fade-in-up">
      <header className="space-y-2">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <h1 className="text-3xl font-black tracking-tighter text-white">
          {contract.project_name || 'Agreement'}
        </h1>
        <p className="text-sm text-slate-400">
          {performs ? 'You are doing the work' : 'The other party is doing the work'}
          {contract.amount_jpy ? <> · ¥{Number(contract.amount_jpy).toLocaleString()}</> : null}
          {contract.deadline ? <> · due {contract.deadline}</> : null}
        </p>
      </header>

      {/* What was agreed. Always visible — it is the agreement. */}
      {dod.length > 0 && (
        <section className="rounded-[24px] border border-white/5 bg-white/[0.02] px-6 py-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
            What counts as complete
          </h2>
          <ul className="space-y-1.5">
            {dod.map((item, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-slate-600">·</span>{item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The one action, or what is being waited on. */}
      <section className="rounded-[24px] border border-white/10 bg-[#0f172a]/60 px-6 py-6 space-y-4">
        {done && (
          <p className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </p>
        )}
        {waitingText && <p className="text-sm text-slate-400">{waitingText}</p>}

        {canAssert && (
          <>
            <p className="text-sm text-slate-300">
              When you have finished the agreed work, record it here.
            </p>
            <button
              onClick={onAssertDelivery}
              disabled={busy}
              className="px-6 py-3 rounded-2xl bg-white text-[#020617] font-black text-sm hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : <><Send className="w-4 h-4" /> Mark as delivered</>}
            </button>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {/* "your identity" claimed more than the record holds: what is bound
                  is the credential that acted, which TrustFlow has never tied to a
                  legal person. */}
              This records that you stated the work was delivered, with the server's time
              and the credential you acted with. It does not state that the work is
              correct — that is for the other party to answer.
            </p>
          </>
        )}

        {canRespond && !correcting && (
          <>
            <p className="text-sm text-slate-300">
              They marked the work delivered. Once you have checked it:
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onAccept}
                disabled={busy}
                className="px-6 py-3 rounded-2xl bg-white text-[#020617] font-black text-sm hover:bg-emerald-400 hover:text-white transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : <><CheckCircle2 className="w-4 h-4" /> Accept</>}
              </button>
              <button
                onClick={() => setCorrecting(true)}
                disabled={busy}
                className="px-6 py-3 rounded-2xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 hover:text-white transition-all disabled:opacity-40"
              >
                Request correction
              </button>
            </div>
          </>
        )}

        {canRespond && correcting && (
          <>
            <label htmlFor="correction-reason" className="block text-sm text-slate-300">
              What needs correcting?
            </label>
            <textarea
              id="correction-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. page 2 is missing"
              className="w-full bg-[#0f172a] border border-white/10 focus:border-indigo-500/50 rounded-2xl px-5 py-3 text-white text-sm outline-none transition-all placeholder:text-slate-600"
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => { await onRequestCorrection(reason.trim()); setCorrecting(false); setReason(''); }}
                disabled={busy || !reason.trim()}
                className="px-6 py-3 rounded-2xl bg-amber-500 text-[#020617] font-black text-sm hover:bg-amber-400 transition-all disabled:opacity-40"
              >
                {busy ? 'Recording…' : 'Send correction request'}
              </button>
              <button
                onClick={() => { setCorrecting(false); setReason(''); }}
                className="px-6 py-3 text-slate-500 hover:text-slate-300 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This records that you asked for a correction, and why. It does not decide that you are
              right — they can deliver again and the record keeps both statements.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">Record</h2>
        <Record events={events} />

        {/* The point of keeping a tamper-evident record is being able to take it
            somewhere else. Until now the export existed but nothing in this
            flow could reach it, so the one thing TrustFlow promises to produce
            was not obtainable by anyone actually using it. */}
        {onExport && (
          <div className="space-y-2 pt-1">
            <button
              onClick={async () => {
                setExportError(null);
                setExporting(true);
                try {
                  await onExport();
                } catch (err) {
                  setExportError('The record could not be exported. Please try again.');
                  console.warn('[TrustFlow] audit export failed:', err);
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/10 text-slate-300 font-bold text-xs hover:border-white/20 hover:text-white transition-all disabled:opacity-40"
            >
              {exporting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing…</>
                : <><Download className="w-3.5 h-3.5" /> Download the signed record</>}
            </button>
            {exportError && (
              <p role="alert" className="flex items-start gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{exportError}
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-600 leading-relaxed border-t border-white/5 pt-4">
          This record is tamper-evident. TrustFlow records what each party stated; it does not
          establish that a statement is true.
          {onExport && ' The download is a self-contained JSON document: it carries every event, '
            + 'its hash and the link to the one before it, so a third party can re-verify the '
            + 'chain without TrustFlow.'}
        </p>
      </section>
    </div>
  );
}
