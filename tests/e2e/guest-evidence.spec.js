// Security coverage for the guest Hirer's read access to their evidence trail.
//
// The guest credential is the only thing that selects a contract — the request
// carries no contract id at all — so most of what these tests protect is the
// absence of a way in, not a check that could be bypassed. They exist to fail
// loudly if a contract id is ever accepted from the caller, if the payload
// allowlist is widened, or if runtime snapshots become reachable.
//
// Requires a verified Earner, same as the other live-API suites:
//   TF_TEST_EARNER_EMAIL / TF_TEST_EARNER_PASSWORD

import { test, expect } from '@playwright/test';
import { getEarnerSession } from './earnerSession.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EARNER_EMAIL = process.env.TF_TEST_EARNER_EMAIL;
const EARNER_PASSWORD = process.env.TF_TEST_EARNER_PASSWORD;

const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY && EARNER_EMAIL && EARNER_PASSWORD);

test.skip(!CONFIGURED,
  'Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, TF_TEST_EARNER_EMAIL and TF_TEST_EARNER_PASSWORD to run the guest-evidence suite.');

async function api(request, path, { method = 'POST', token, guestToken, body, prefer } = {}) {
  const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guestToken) headers['x-guest-access-token'] = guestToken;
  if (prefer) headers.Prefer = prefer;
  const response = await request.fetch(`${SUPABASE_URL}${path}`, { method, headers, data: body });
  let parsed = null;
  try { parsed = await response.json(); } catch { /* empty body */ }
  return { status: response.status(), body: parsed };
}

// The Earner session is shared across every live-API suite and cached on disk
// — see earnerSession.js. Five suites each opening their own session put enough
// traffic through Supabase Auth to time out token grants during a full run,
// failing tests that had nothing to do with authentication.
const signInEarner = getEarnerSession;

/**
 * A contract that has been accepted by a guest, with a handful of events on it.
 * Returns the guest credential plus what the guest ought to be able to see.
 */
async function acceptedContract(request, { projectName = 'Guest Evidence Probe' } = {}) {
  const { token, userId } = await signInEarner(request);

  const created = await api(request, '/rest/v1/contracts', {
    token,
    prefer: 'return=representation',
    body: {
      earner_user_id: userId,
      earner_display_name: 'Evidence Suite Earner',
      project_name: projectName,
      dod: ['deliverable one', 'deliverable two'],
      amount_jpy: 42000,
      currency: 'JPY',
      invited_hirer_email: 'invited@example.test',
    },
  });
  expect(created.status, `contract insert failed: ${JSON.stringify(created.body)}`).toBe(201);
  const contract = created.body[0];

  await api(request, '/functions/v1/log-event', {
    token, body: { type: 'contract.initiated', contract_id: contract.id, dod_hash: 'probe-dod-hash', payload: { step: 1 } },
  });

  const accept = await api(request, '/functions/v1/validate-invite-token', {
    body: { invite_token: contract.invite_token, accept: true, hirer_email: 'guest.reader@example.test' },
  });
  expect(accept.status).toBe(200);

  await api(request, '/functions/v1/log-event', {
    guestToken: accept.body.guest_access_token,
    body: { type: 'dod.consent_recorded', contract_id: contract.id, payload: { counterparty_name: 'Guest Reader' } },
  });

  return { contract, earnerToken: token, earnerUserId: userId, guestToken: accept.body.guest_access_token };
}

// ── The happy path ──────────────────────────────────────────────────────────

test('a valid guest can read the evidence trail for their own contract', async ({ request }) => {
  const { contract, guestToken } = await acceptedContract(request);

  const { status, body } = await api(request, '/functions/v1/guest-contract-events', { guestToken });

  expect(status).toBe(200);
  expect(body.contract.id).toBe(contract.id);
  expect(body.contract.project_name).toBe('Guest Evidence Probe');
  expect(body.contract.hirer_email).toBe('guest.reader@example.test');

  const types = body.events.map(e => e.type);
  expect(types).toContain('contract.initiated');
  expect(types).toContain('dod.consent_recorded');

  // The guest sees who acted, in terms they can read.
  const consent = body.events.find(e => e.type === 'dod.consent_recorded');
  expect(consent.actor.role).toBe('guest_hirer');
  expect(consent.actor.label).toBe('guest.reader@example.test');

  const initiated = body.events.find(e => e.type === 'contract.initiated');
  expect(initiated.actor.role).toBe('earner');
  expect(initiated.actor.label).toBe('Evidence Suite Earner');

  // Chain verification is reported, and it holds.
  expect(body.chain.verified).toBe(true);
  expect(body.chain.server_attested).toBeGreaterThan(0);
  for (const event of body.events) {
    expect(event.integrity.hash_valid).not.toBe(false);
    expect(event.integrity.chain_linked).not.toBe(false);
    expect(event.integrity.trust_model).toBe('server_attested');
  }
});

// ── Isolation between contracts ─────────────────────────────────────────────

test("a guest token for contract A cannot read contract B", async ({ request }) => {
  const a = await acceptedContract(request, { projectName: 'Contract A' });
  const b = await acceptedContract(request, { projectName: 'Contract B' });

  const asA = await api(request, '/functions/v1/guest-contract-events', { guestToken: a.guestToken });
  expect(asA.status).toBe(200);
  expect(asA.body.contract.id).toBe(a.contract.id);
  expect(asA.body.contract.project_name).toBe('Contract A');

  // Every event returned belongs to A. B's contract id appears nowhere.
  const serialized = JSON.stringify(asA.body);
  expect(serialized).not.toContain(b.contract.id);
  expect(serialized).not.toContain('Contract B');
});

test('the request body cannot change which contract is read', async ({ request }) => {
  const a = await acceptedContract(request, { projectName: 'Body Spoof A' });
  const b = await acceptedContract(request, { projectName: 'Body Spoof B' });

  // Every field an attacker might hope the server reads.
  const { status, body } = await api(request, '/functions/v1/guest-contract-events', {
    guestToken: a.guestToken,
    body: {
      contract_id: b.contract.id,
      id: b.contract.id,
      hirer_email: 'guest.reader@example.test',
      actor_id: b.earnerUserId,
      guest_access_token: b.guestToken,
    },
  });

  expect(status).toBe(200);
  expect(body.contract.id).toBe(a.contract.id);
  expect(JSON.stringify(body)).not.toContain(b.contract.id);
});

// ── Failing closed ──────────────────────────────────────────────────────────

test('an invalid or missing guest token fails closed', async ({ request }) => {
  const missing = await api(request, '/functions/v1/guest-contract-events', {});
  expect(missing.status).toBe(401);
  expect(missing.body.error).toBe('missing_guest_token');

  // Well-formed but unknown, and malformed, are indistinguishable to a caller.
  const unknown = await api(request, '/functions/v1/guest-contract-events', {
    guestToken: '00000000-0000-4000-8000-0000000000ff',
  });
  expect(unknown.status).toBe(403);
  expect(unknown.body.error).toBe('invalid_guest_token');

  const malformed = await api(request, '/functions/v1/guest-contract-events', {
    guestToken: 'not-a-uuid',
  });
  expect(malformed.status).toBe(403);
  expect(malformed.body.error).toBe('invalid_guest_token');
});

// Seeded by 20260924140000. A test cannot age a credential it was just
// issued — guest_access_token_expires_at is server-owned and the client has no
// UPDATE privilege on contracts — so the expiry branch needs a row that is
// already expired. This credential grants nothing; being expired, the only
// response it can produce is the one asserted here.
const EXPIRED_GUEST_TOKEN = 'fffffff0-0000-4000-8000-000000000001';

test('an expired guest token fails closed', async ({ request }) => {
  const { status, body } = await api(request, '/functions/v1/guest-contract-events', {
    guestToken: EXPIRED_GUEST_TOKEN,
  });

  expect(status).toBe(403);
  expect(body.error).toBe('guest_token_expired');
  // Nothing about the contract leaks alongside the refusal.
  expect(body.contract).toBeUndefined();
  expect(body.events).toBeUndefined();
});

test('the client cannot extend its own guest credential', async ({ request }) => {
  const { contract, earnerToken } = await acceptedContract(request);

  const patch = await api(request, `/rest/v1/contracts?id=eq.${contract.id}`, {
    method: 'PATCH',
    token: earnerToken,
    body: { guest_access_token_expires_at: '2099-01-01T00:00:00Z' },
  });

  // Even the contract's own Earner holds no UPDATE privilege on contracts.
  expect(patch.status).toBeGreaterThanOrEqual(401);
});

test('a public anonymous client cannot read the trail without a credential', async ({ request }) => {
  const { contract } = await acceptedContract(request);

  // No guest token, anon key only.
  const viaFunction = await api(request, '/functions/v1/guest-contract-events', {});
  expect(viaFunction.status).toBe(401);

  // And the underlying table stays closed to it.
  const viaTable = await api(request,
    `/rest/v1/events?select=id,type,payload&contract_id=eq.${contract.id}`, { method: 'GET' });
  expect(viaTable.status).toBe(200);
  expect(viaTable.body).toEqual([]);
});

// ── Nothing internal leaks ──────────────────────────────────────────────────

test('runtime snapshots and internal rows are never returned', async ({ request }) => {
  const { guestToken } = await acceptedContract(request);

  const { status, body } = await api(request, '/functions/v1/guest-contract-events', { guestToken });
  expect(status).toBe(200);

  const serialized = JSON.stringify(body);
  expect(body.events.some(e => e.type === 'runtime.snapshot')).toBe(false);
  // Snapshot payload keys carry the Earner's whole app state, including their
  // own contact details and other clients' addresses.
  for (const key of ['byocForm', 'uiProfile', 'internalProfile', 'contractHistory',
                     'activityLog', 'badActorFlags', 'selectedItem']) {
    expect(serialized, `snapshot field ${key} leaked`).not.toContain(key);
  }
});

test('internal event fields are omitted and payloads are allowlisted', async ({ request }) => {
  const { contract, earnerToken, guestToken } = await acceptedContract(request);

  // An event whose payload carries a field nobody allowlisted.
  await api(request, '/functions/v1/log-event', {
    token: earnerToken,
    body: {
      type: 'work.submitted',
      contract_id: contract.id,
      idempotency_key: 'guest-evidence-secret-key',
      payload: { step: 3, internal_note: 'SHOULD-NOT-REACH-GUEST', user_agent: 'probe-agent/1.0' },
    },
  });

  const { status, body } = await api(request, '/functions/v1/guest-contract-events', { guestToken });
  expect(status).toBe(200);

  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('SHOULD-NOT-REACH-GUEST');
  expect(serialized).not.toContain('probe-agent/1.0');
  expect(serialized).not.toContain('guest-evidence-secret-key');
  expect(serialized).not.toContain('_actor_role');
  expect(serialized).not.toContain('server_recorded_at');
  expect(serialized).not.toContain('guest_access_token');
  expect(serialized).not.toContain('invite_token');

  const submitted = body.events.find(e => e.type === 'work.submitted');
  expect(Object.keys(submitted.payload)).toEqual(['step']);
  // The role survives, lifted out of the payload into a field of its own.
  expect(submitted.actor.role).toBe('earner');
});

// ── The Hirer-facing view, end to end in the browser ────────────────────────

test('a guest accepts an invite and can then read the record in the UI', async ({ page, request }) => {
  const { token, userId } = await signInEarner(request);
  const created = await api(request, '/rest/v1/contracts', {
    token,
    prefer: 'return=representation',
    body: {
      earner_user_id: userId,
      earner_display_name: 'UI Flow Earner',
      project_name: 'UI Flow Probe',
      dod: ['ship the thing'],
      amount_jpy: 7500,
      currency: 'JPY',
      invited_hirer_email: 'ui.guest@example.test',
    },
  });
  expect(created.status).toBe(201);
  const contract = created.body[0];

  await api(request, '/functions/v1/log-event', {
    token, body: { type: 'contract.initiated', contract_id: contract.id, payload: { step: 1 } },
  });

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${contract.invite_token}`);

  // Stage 1: review the terms, then move to the consent stage.
  await expect(page.getByText('UI Flow Probe')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Review Agreement|Continue|Accept/i }).first().click();

  // Stage 2: identity plus explicit consent.
  //
  // The email is typed rather than left at its prefilled value on purpose. The
  // field renders `guestEmail || invitedEmail`, but the submit button is gated
  // on `guestEmail` alone, so accepting the address shown without editing it
  // leaves the button disabled. That is a defect in the acceptance flow, noted
  // separately; this test types a distinct address both to get past it and
  // because accepting from a different address than the invite went to is the
  // case worth exercising.
  await page.getByPlaceholder('Your name or handle').fill('UI Guest');
  await page.getByPlaceholder(/Email address/i).fill('ui.actual@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /I Agree/i }).click();

  // The toast and the view heading carry the same words, and the toast is also
  // a heading element. Level 2 is the one that means the view actually
  // switched; the toast renders at level 4.
  await expect(page.getByRole('heading', { name: /Agreement accepted/i, level: 2 }))
    .toBeVisible({ timeout: 15_000 });

  // The credential issued on acceptance is what unlocks the record.
  await page.getByRole('button', { name: /View the record/i }).click();

  await expect(page.getByText(/Record of agreement/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Agreement created')).toBeVisible();
  await expect(page.getByText('Terms accepted')).toBeVisible();
  await expect(page.getByText(/Hash chain verified/i)).toBeVisible();
  // The trail says who acted, in readable terms rather than raw ids. The name
  // also appears in the header, so this targets the actor line specifically.
  await expect(page.getByText('UI Flow Earner', { exact: true })).toBeVisible();
  // And the guest's own entry is attributed to them. The address shows twice —
  // as the actor label and as the allowlisted counterparty_email detail — so
  // this asserts presence rather than uniqueness.
  await expect(page.getByText('ui.actual@example.test', { exact: true }).first()).toBeVisible();

  // And it does not overstate what the hash covers.
  await expect(page.getByText(/not.*cover the detail fields/i)).toBeVisible();
});

test('the response states that payloads are outside the hash', async ({ request }) => {
  const { guestToken } = await acceptedContract(request);

  const { body } = await api(request, '/functions/v1/guest-contract-events', { guestToken });

  // The canonical covers id, type, contract_id, actor_id, dod_hash, created_at
  // and prev_hash — not payload. Saying so in the response keeps the trail from
  // implying more than it proves.
  expect(body.chain.payload_covered_by_hash).toBe(false);
});
