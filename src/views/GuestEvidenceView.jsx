// src/views/GuestEvidenceView.jsx
// The guest Hirer's view of the evidence trail for the contract they accepted.
//
// Everything rendered here comes from the guest-contract-events Edge Function,
// which resolves the contract from the guest credential alone and returns a
// shaped subset — not raw event rows. This component does no verification of
// its own; it reports what the server verified, and is deliberate about not
// overstating it (see the footnote about payload coverage).

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

const TYPE_LABELS = {
  'contract.initiated':   'Agreement created',
  'contract.accepted':    'Agreement accepted',
  'work.submitted':       'Work submitted',
  'work.approved':        'Work approved',
  'work.rejected':        'Work rejected',
  'contract.cancelled':   'Agreement cancelled',
  'contract.completed':   'Agreement completed',
  'dod.consent_recorded': 'Terms accepted',
  'dispute.opened':       'Dispute opened',
  'rating.submitted':     'Rating submitted',
};

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function EventRow({ event }) {
  const attested = event.integrity.trust_model === 'server_attested';
  // Only false is a problem. null means the row carries nothing to check,
  // which is a different statement from "the check failed".
  const broken = event.integrity.hash_valid === false || event.integrity.chain_linked === false;

  return (
    <li className="relative pl-8 pb-6 last:pb-0 border-l border-white/10 last:border-transparent">
      <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
        broken ? 'bg-red-500' : attested ? 'bg-emerald-500' : 'bg-slate-500'
      }`} />

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-white font-bold text-sm">
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
        <span className="text-[11px] text-slate-500 font-mono">{formatWhen(event.created_at)}</span>
      </div>

      <p className="text-xs text-slate-400 mt-1">
        by <span className="text-slate-300">{event.actor.label}</span>
        {event.actor.role === 'guest_hirer' && <span className="text-slate-600"> (you)</span>}
      </p>

      {Object.keys(event.payload).length > 0 && (
        <dl className="mt-2 text-[11px] text-slate-500 space-y-0.5">
          {Object.entries(event.payload).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="text-slate-600">{key}</dt>
              <dd className="text-slate-400">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
        broken ? 'text-red-400' : attested ? 'text-emerald-500/70' : 'text-amber-500/70'
      }`}>
        {broken
          ? <><ShieldAlert className="w-3 h-3" />Integrity check failed</>
          : attested
            ? <><ShieldCheck className="w-3 h-3" />Server-attested</>
            : <><AlertTriangle className="w-3 h-3" />Client-asserted</>}
      </p>
    </li>
  );
}

export default function GuestEvidenceView({ evidence, reason, onBack }) {
  if (reason) {
    const message = {
      no_credential:      'This browser does not hold a credential for the agreement.',
      invalid_guest_token:'This access link is no longer valid.',
      guest_token_expired:'This access link has expired.',
    }[reason] ?? 'The evidence trail could not be loaded.';

    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-20">
        <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-slate-400 text-sm">{message}</p>
        {onBack && (
          <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300 underline">
            Go back
          </button>
        )}
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 text-slate-500 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-3 animate-pulse" />
        Loading the record…
      </div>
    );
  }

  const { contract, events, chain } = evidence;

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8 animate-fade-in-up">
      <header className="space-y-2">
        <h2 className="text-3xl font-black tracking-tighter text-white">Record of agreement</h2>
        <p className="text-slate-400 text-sm">
          {contract.project_name} — with {contract.earner_display_name ?? 'your counterparty'}
        </p>
        <p className="text-xs text-slate-600">
          Accepted as {contract.hirer_email}
        </p>
      </header>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-xs space-y-1">
        <p className="text-slate-400">
          <span className="text-slate-600">{chain.event_count}</span> event{chain.event_count === 1 ? '' : 's'} recorded
          {chain.client_asserted > 0 && (
            <span className="text-amber-500/70">
              {' '}· {chain.client_asserted} predate server attestation
            </span>
          )}
        </p>
        <p className={chain.verified ? 'text-emerald-500/80' : 'text-slate-500'}>
          {chain.verified
            ? 'Hash chain verified across every server-attested event.'
            : 'No server-attested events to verify yet.'}
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-slate-500 text-sm">Nothing has been recorded on this agreement yet.</p>
      ) : (
        <ol className="ml-1">
          {events.map(event => <EventRow key={event.id} event={event} />)}
        </ol>
      )}

      <p className="text-[11px] text-slate-600 leading-relaxed border-t border-white/5 pt-4">
        Each event's hash covers its type, timing, actor and the agreement it belongs to, and links
        to the event before it. It does <span className="text-slate-500">not</span> cover the detail
        fields shown under each entry, so those are recorded but not tamper-evident.
        {chain.truncated && ' Only the earliest events are shown.'}
      </p>

      {onBack && (
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300 underline">
          Go back
        </button>
      )}
    </div>
  );
}
