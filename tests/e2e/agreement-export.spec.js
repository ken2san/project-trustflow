// The export button on the agreement Record section.
//
// onExport re-fetches the raw event rows from `events` (see exportAgreementRecord
// in App.jsx) to build a re-verifiable document. A guest has no auth.users row,
// so RLS gives them nothing from that table directly — their trail only ever
// arrives pre-shaped from guest-contract-events, which cannot be turned back
// into a hash-checkable export. So the button is owner-only, and this is the
// one seam most likely to regress silently: nothing stops a future change from
// handing a guest a button that fails every time it's pressed.
//
// Both sides are reached the way a real user reaches them — opening a contract
// from the signed-in owner's list, and accepting a guest invite — rather than
// constructing `agreement.source` directly, so this also proves the two routes
// still land on `source: 'owner'` / `source: 'guest'` respectively.

import { test, expect } from '@playwright/test';

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

test('a guest never sees the export button, even on the same agreement', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'Download the signed record' })).toHaveCount(0);
});
