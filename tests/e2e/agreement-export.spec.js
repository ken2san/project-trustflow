// The export buttons on the agreement Record section.
//
// Both parties can take the record away, but they are given DIFFERENT
// documents, and keeping them apart is the point of this file.
//
// The owner re-fetches the raw event rows from `events` (exportAgreementRecord
// in App.jsx) and gets a self-contained document a third party can re-verify.
// A guest has no auth.users row, so RLS gives them nothing from that table:
// their trail only ever arrives pre-shaped from guest-contract-events with each
// payload allowlist-filtered. Recomputing a hash over that would fail on an
// untouched record, so the guest gets the server's verified record instead
// (exportGuestRecord), which reports what TrustFlow checked and does not invite
// a recomputation it knows would not match.
//
// This is the seam most likely to regress silently: the damaging change is not
// a missing button, it is a guest handed the owner's document — one that would
// cry tampering on an intact record.
//
// Both sides are reached the way a real user reaches them — opening a contract
// from the signed-in owner's list, and accepting a guest invite — rather than
// constructing `agreement.source` directly, so this also proves the two routes
// still land on `source: 'owner'` / `source: 'guest'` respectively.

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const json = (route, body, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});

// ── Owner path: contracts-home.spec.js's stubbing style ─────────────────────

const OWNER_CONTRACT = {
  id: '11111111-1111-4111-8111-111111111111',
  project_name: 'Owner export check',
  dod: ['deliver the thing'], amount_jpy: 50000, currency: 'JPY', deadline: '2026-12-01',
  state: 'TERMS_ACCEPTED',
  earner_display_name: 'Me', invited_hirer_email: 'client@example.test',
  hirer_email: 'client@example.test',
  invite_token: null, invite_token_expires_at: null,
  invite_token_used_at: new Date(Date.now() - 48 * 3_600_000).toISOString(),
  created_at: new Date(Date.now() - 72 * 3_600_000).toISOString(),
};

test('the owner sees the export button on their own agreement', async ({ page }) => {
  await page.route('**/rest/v1/contracts*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await json(route, [OWNER_CONTRACT]);
  });
  await page.route('**/rest/v1/events*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await json(route, []);
  });
  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));

  await page.goto('/');
  await page.getByRole('button', { name: 'Open' }).click();

  await expect(page.getByText('What counts as complete')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Download the signed record' })).toBeVisible();
});

// ── Guest path: agreement-record-ui.spec.js's stubbing style ────────────────

const ACCEPTED = {
  snapshot_version: 1,
  project_name: 'Guest export check',
  dod: ['deliver the thing'],
  amount: 50000,
  currency: 'JPY',
  deadline: '2026-12-01',
  performed_by: 'creator',
  offered_by: 'Acme Co',
};

const GUEST_CONTRACT_ID = '22222222-2222-4222-8222-222222222222';
const GUEST_INVITE_TOKEN = '33333333-3333-4333-8333-333333333333';

test('a guest is given the server-verified record, not the owner document', async ({ page }) => {
  await page.route('**/functions/v1/validate-invite-token', route => json(route, {
    contract_id: GUEST_CONTRACT_ID,
    project_name: ACCEPTED.project_name,
    dod: ACCEPTED.dod,
    amount_jpy: ACCEPTED.amount,
    currency: ACCEPTED.currency,
    deadline: ACCEPTED.deadline,
    earner_display_name: ACCEPTED.offered_by,
    invited_hirer_email: 'invited@example.test',
    performed_by: ACCEPTED.performed_by,
    guest_access_token: 'stub-guest-token',
  }));

  await page.route('**/functions/v1/guest-contract-events', route => json(route, {
    accepted_agreement: ACCEPTED,
    acceptance_identity: {
      invited_recipient: 'invited@example.test',
      claimed_identity: 'someone.else@example.test',
      claimed_identity_verified: false,
      authentication: 'invite_capability',
    },
    terms_changed_since_acceptance: [],
    contract: {
      id: GUEST_CONTRACT_ID,
      project_name: ACCEPTED.project_name,
      dod: ACCEPTED.dod,
      amount_jpy: ACCEPTED.amount,
      currency: ACCEPTED.currency,
      deadline: ACCEPTED.deadline,
      state: 'TERMS_ACCEPTED',
      performed_by: ACCEPTED.performed_by,
      viewer_role: 'receiver',
      earner_display_name: ACCEPTED.offered_by,
      hirer_email: 'someone.else@example.test',
    },
    events: [{
      id: '44444444-4444-4444-8444-444444444444',
      type: 'dod.consent_recorded',
      created_at: '2026-09-24T12:00:00.000Z',
      actor: { id: null, role: 'guest_hirer', label: 'You' },
      dod_hash: 'terms-hash',
      payload: { counterparty_name: 'Guest' },
      integrity: {
        trust_model: 'server_attested',
        event_hash: 'abc', prev_event_hash: 'GENESIS',
        hash_valid: true, chain_linked: true, substance_valid: true,
        binds_whole_agreement: true,
      },
    }],
    chain: {
      event_count: 1, server_attested: 1, client_asserted: 0,
      verified: true, truncated: false, payload_covered_by_hash: true,
    },
  }));

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${GUEST_INVITE_TOKEN}`);
  await expect(page.getByText(ACCEPTED.project_name).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Review Agreement' }).click();
  await page.getByPlaceholder('Your name or handle').fill('Guest');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /I Agree/ }).click();
  // "Open this agreement", not "View the full verification detail" — the latter
  // goes to GuestEvidenceView, which never had an export button, so asserting
  // its absence there would pass without proving anything. This button is the
  // one that puts a guest on AgreementView, the shared screen where the owner
  // DOES get an export, and therefore the only place the source gate is load
  // bearing.
  await page.getByRole('button', { name: 'Open this agreement' })
    .click({ timeout: 15_000 });

  // The same screen the owner test asserted against.
  await expect(page.getByText('What counts as complete')).toBeVisible({ timeout: 15_000 });

  // Never the owner's artefact. That document tells its reader to recompute
  // every hash, which on an allowlist-filtered payload fails on an intact
  // record — the one failure this product can least afford.
  await expect(page.getByRole('button', { name: 'Download the signed record' })).toHaveCount(0);

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download your copy of the record' }).click();
  const file = await downloading;
  const doc = JSON.parse(await readFile(await file.path(), 'utf8'));

  // Named so it cannot be mistaken for the re-verifiable export.
  expect(doc.trustflow_audit_trail).toBeUndefined();
  const record = doc.trustflow_counterparty_record;
  expect(record.document_type).toBe('server_verified_record');
  expect(record.agreement_id).toBe(GUEST_CONTRACT_ID);

  // The server's verdict, carried through rather than re-derived here.
  expect(record.verification.server_verdict).toBe(true);
  expect(record.verification.status).toBe('VERIFIED');
  expect(record.verification.truncated).toBe(false);

  // It does not ask the reader to do what would fail, and says so.
  expect(record.verification_instructions).toBeUndefined();
  expect(JSON.stringify(record.what_this_document_is)).toMatch(/CANNOT be reproduced/);

  // The accepted deal is preserved, and the claimed identity is not upgraded.
  expect(record.accepted_agreement.amount).toBe(ACCEPTED.amount);
  expect(record.acceptance_identity.claimed_identity_verified).toBe(false);
  expect(record.events).toHaveLength(1);
  expect(record.events[0].server_verification.hash_valid).toBe(true);
});
