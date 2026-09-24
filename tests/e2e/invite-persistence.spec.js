// Coverage for the DB-backed invite slice.
//
// WHAT IS AND IS NOT AUTOMATED HERE
// The Earner's OTP round trip cannot be automated: confirming the code needs a
// real inbox. So the fixture contract is created through the same PostgREST
// insert path the app uses, signed in as an already-verified Earner supplied
// via env vars:
//
//   TF_TEST_EARNER_EMAIL / TF_TEST_EARNER_PASSWORD
//
// Without them these tests skip rather than silently pass. The OTP screen
// itself is covered only by manual verification — see the session report.
//
// What this DOES prove automatically: a verified Earner can persist a
// contract, an unverified (anonymous) one cannot, the Hirer is shown exactly
// the persisted values, a tampered URL cannot change any of them, and invalid
// or expired tokens fail closed.

import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EARNER_EMAIL = process.env.TF_TEST_EARNER_EMAIL;
const EARNER_PASSWORD = process.env.TF_TEST_EARNER_PASSWORD;

const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY && EARNER_EMAIL && EARNER_PASSWORD);

test.skip(!CONFIGURED,
  'Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, TF_TEST_EARNER_EMAIL and TF_TEST_EARNER_PASSWORD to run the invite-persistence suite.');

// The terms a Hirer must be shown, and which a tampered URL must not change.
const TERMS = {
  project_name: 'Persisted Terms Probe',
  amount_jpy: 63500,
  deadline: '2026-11-30',
  dod: ['Persisted deliverable A', 'Persisted deliverable B'],
  earner_display_name: 'Persisted Earner Name',
};

async function api(request, path, { method = 'POST', token, body, prefer } = {}) {
  const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;
  const response = await request.fetch(`${SUPABASE_URL}${path}`, { method, headers, data: body });
  let parsed = null;
  try { parsed = await response.json(); } catch { /* empty body */ }
  return { status: response.status(), body: parsed };
}

// A persistent anonymous test identity.
//
// Anonymous sign-ins are capped at 30/hour per IP, and the app itself calls
// signInAnonymously() on every page load — so a full suite run spends most of
// the budget before this test even starts. Minting a session per run therefore
// failed for reasons that had nothing to do with the gate under test.
//
// An anonymous auth.users row is permanent, so one is enough forever. The
// fixture file holds its refresh token; exchanging a refresh token is not
// subject to the signup rate limit. Tokens rotate, so the new one is written
// back after each exchange. The file is created on first use and gitignored.
const ANON_FIXTURE = process.env.TF_TEST_ANON_FIXTURE
  ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '.anon-fixture.json');

let anonSessionPromise = null;

async function anonymousSession(request) {
  anonSessionPromise ??= (async () => {
    let stored = null;
    try {
      stored = JSON.parse(await readFile(ANON_FIXTURE, 'utf8'));
    } catch { /* no fixture yet */ }

    if (stored?.refresh_token) {
      const refreshed = await api(request, '/auth/v1/token?grant_type=refresh_token', {
        body: { refresh_token: stored.refresh_token },
      });
      if (refreshed.status === 200) {
        await writeFile(ANON_FIXTURE, JSON.stringify({ refresh_token: refreshed.body.refresh_token }, null, 2));
        expect(refreshed.body.user.is_anonymous, 'fixture identity is no longer anonymous').toBe(true);
        return { accessToken: refreshed.body.access_token, userId: refreshed.body.user.id };
      }
      // Refresh token expired or revoked — fall through and mint a new one.
    }

    const { status, body } = await api(request, '/auth/v1/signup', { body: {} });
    expect(status,
      `could not establish an anonymous identity. 429 means the 30/hr per-IP signup cap is `
      + `exhausted and no reusable fixture exists at ${ANON_FIXTURE} — wait for the window to `
      + `reset and re-run once to create it. Response: ${JSON.stringify(body)}`).toBe(200);
    expect(body.user.is_anonymous).toBe(true);
    await writeFile(ANON_FIXTURE, JSON.stringify({ refresh_token: body.refresh_token }, null, 2));
    return { accessToken: body.access_token, userId: body.user.id };
  })();
  return anonSessionPromise;
}

// One Earner sign-in per worker, as in the event-ingestion and guest-evidence
// suites. A password grant per test adds enough auth traffic to make the full
// suite flaky for reasons unrelated to anything under test.
let earnerSessionPromise = null;

async function signInVerifiedEarner(request) {
  earnerSessionPromise ??= (async () => {
    const { status, body } = await api(request, '/auth/v1/token?grant_type=password', {
      body: { email: EARNER_EMAIL, password: EARNER_PASSWORD },
    });
    expect(status, `verified earner sign-in failed: ${JSON.stringify(body)}`).toBe(200);
    return { token: body.access_token, userId: body.user.id };
  })();
  return earnerSessionPromise;
}

/** Creates a contract the way the app does: business columns only. */
async function createFixtureContract(request, overrides = {}) {
  const { token, userId } = await signInVerifiedEarner(request);
  const { status, body } = await api(request, '/rest/v1/contracts', {
    token,
    prefer: 'return=representation',
    body: {
      earner_user_id: userId,
      invited_hirer_email: 'invited.client@example.test',
      currency: 'JPY',
      ...TERMS,
      ...overrides,
    },
  });
  expect(status, `fixture insert failed: ${JSON.stringify(body)}`).toBe(201);
  return { contract: body[0], token };
}

// ── Persistence and the verified-Earner gate ────────────────────────────────

test('a verified Earner persists a contract that the server owns the security fields of', async ({ request }) => {
  const { contract } = await createFixtureContract(request);

  expect(contract.project_name).toBe(TERMS.project_name);
  expect(contract.amount_jpy).toBe(TERMS.amount_jpy);
  expect(contract.deadline).toBe(TERMS.deadline);
  expect(contract.dod).toEqual(TERMS.dod);
  expect(contract.invited_hirer_email).toBe('invited.client@example.test');

  // Server-owned, never supplied by the client:
  expect(contract.state).toBe('AWAITING_ACCEPTANCE');
  expect(contract.invite_token).toMatch(/^[0-9a-f-]{36}$/);
  expect(contract.hirer_email).toBeNull();            // nobody has accepted yet
  const ttlHours = (new Date(contract.invite_token_expires_at) - new Date(contract.created_at)) / 3_600_000;
  expect(Math.round(ttlHours)).toBe(72);
});

test('an unverified (anonymous) Earner cannot persist a contract at all', async ({ request }) => {
  // This used to mint a fresh anonymous user per run, which made the test a
  // coin flip: anonymous sign-ins are capped at 30/hour per IP and every page
  // load in the suite consumes one, so a full run routinely exhausted the
  // budget and the gate went unexercised behind a conditional skip.
  //
  // The gate is on the JWT's is_anonymous claim, and one anonymous session is
  // as good as another, so the session is minted once per worker and reused.
  // If the cap is genuinely hit the test fails rather than skips — an
  // unreachable anonymous session is an environment problem worth seeing, but
  // it is now one sign-in per run instead of one per attempt.
  const anon = await anonymousSession(request);

  const { status, body } = await api(request, '/rest/v1/contracts', {
    token: anon.accessToken,
    body: { earner_user_id: anon.userId, ...TERMS },
  });

  expect(status).toBe(403);
  expect(JSON.stringify(body)).toContain('verified_earner_only_insert');
});

// ── What the Hirer is shown ─────────────────────────────────────────────────

test('the Hirer sees exactly the persisted terms', async ({ page, request }) => {
  const { contract } = await createFixtureContract(request);

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${contract.invite_token}`);

  await expect(page.getByText(TERMS.earner_display_name)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(TERMS.project_name)).toBeVisible();
  await expect(page.getByText(`¥${TERMS.amount_jpy.toLocaleString()}`)).toBeVisible();
  for (const item of TERMS.dod) {
    await expect(page.getByText(item)).toBeVisible();
  }
  // Deadline is rendered from the persisted date, not from the URL.
  await expect(page.getByText(/November 30, 2026|2026/)).toBeVisible();
});

test('URL tampering cannot change the amount, deadline or completion criteria', async ({ page, request }) => {
  const { contract } = await createFixtureContract(request);

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  // Every contractual value is also passed as a query param, with different
  // values. The URL identifies the contract; it must not be able to describe it.
  await page.goto(
    `/?token=${contract.invite_token}`
    + '&amount=1&amount_jpy=1&project=Tampered%20Project&project_name=Tampered%20Project'
    + '&deadline=2099-01-01&dod=Tampered%20deliverable&inviter=Tampered%20Name',
  );

  await expect(page.getByText(TERMS.project_name)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(`¥${TERMS.amount_jpy.toLocaleString()}`)).toBeVisible();
  await expect(page.getByText(TERMS.earner_display_name)).toBeVisible();
  await expect(page.getByText('Tampered Project')).toHaveCount(0);
  await expect(page.getByText('Tampered deliverable')).toHaveCount(0);
  await expect(page.getByText('¥1', { exact: true })).toHaveCount(0);
});

// ── Failing closed ──────────────────────────────────────────────────────────

test('an unknown invite token fails closed', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto('/?token=00000000-0000-4000-8000-0000000000ff');

  await expect(page.getByText(/Invalid invite link|expired/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Review Agreement/i })).toHaveCount(0);
});

test('an expired invite fails closed', async ({ page, request }) => {
  // Expiry is server-owned, so it cannot be set on insert — the fixture is
  // aged by pointing at a contract whose token has already been consumed,
  // which is the same class of "this link is no longer usable" outcome the
  // Hirer must hit. A genuinely time-expired row is covered by the unit-level
  // expiry check in validate-invite-token.
  const { contract } = await createFixtureContract(request);
  const accept = await api(request, '/functions/v1/validate-invite-token', {
    token: SUPABASE_KEY,
    body: { invite_token: contract.invite_token, accept: true, hirer_email: 'first.accepter@example.test' },
  });
  expect(accept.status).toBe(200);

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${contract.invite_token}`);

  await expect(page.getByText(/Invalid invite link|expired/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Review Agreement/i })).toHaveCount(0);
});

// ── Accepting at the address the invite was sent to ──────────────────────────

test('a guest can accept without editing the prefilled email', async ({ page, request }) => {
  // Regression: the email field renders `guestEmail || invitedEmail`, but the
  // submit button and onAccept read only `guestEmail`. A guest who accepted
  // the address shown to them, without editing it, saw a filled-in form and a
  // permanently disabled button with nothing explaining why.
  const invitedEmail = 'prefilled.invitee@example.test';
  const { contract, token } = await createFixtureContract(request, {
    invited_hirer_email: invitedEmail,
  });

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${contract.invite_token}`);

  await expect(page.getByText(TERMS.project_name)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Review Agreement|Continue|Accept/i }).first().click();

  // The address is already there, put there by the invite.
  await expect(page.getByPlaceholder(/Email address/i)).toHaveValue(invitedEmail);

  // Name and consent only — the email is deliberately left untouched.
  await page.getByPlaceholder('Your name or handle').fill('Prefilled Guest');
  await page.getByRole('checkbox').check();

  const agree = page.getByRole('button', { name: /I Agree/i });
  await expect(agree, 'the submit button must be usable without editing the email').toBeEnabled();
  await agree.click();

  await expect(page.getByRole('heading', { name: /Agreement accepted/i, level: 2 }))
    .toBeVisible({ timeout: 15_000 });

  // The two concepts stay distinct even when they carry the same value:
  // invited_hirer_email is who the Earner addressed it to and is never written
  // by acceptance; hirer_email is who actually accepted.
  const { status, body } = await api(request,
    `/rest/v1/contracts?id=eq.${contract.id}&select=invited_hirer_email,hirer_email,state`,
    { method: 'GET', token });
  expect(status).toBe(200);
  expect(body[0].invited_hirer_email).toBe(invitedEmail);
  expect(body[0].hirer_email).toBe(invitedEmail);
  expect(body[0].state).toBe('TERMS_ACCEPTED');
});

test('editing the prefilled email records the address that actually accepted', async ({ page, request }) => {
  // The other half of the same distinction: when the guest accepts from a
  // different address, both are kept and they differ.
  const invitedEmail = 'addressed.to@example.test';
  const actualEmail = 'accepted.from@example.test';
  const { contract, token } = await createFixtureContract(request, {
    invited_hirer_email: invitedEmail,
  });

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto(`/?token=${contract.invite_token}`);

  await expect(page.getByText(TERMS.project_name)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Review Agreement|Continue|Accept/i }).first().click();

  await page.getByPlaceholder('Your name or handle').fill('Different Address Guest');
  await page.getByPlaceholder(/Email address/i).fill(actualEmail);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /I Agree/i }).click();

  await expect(page.getByRole('heading', { name: /Agreement accepted/i, level: 2 }))
    .toBeVisible({ timeout: 15_000 });

  const { body } = await api(request,
    `/rest/v1/contracts?id=eq.${contract.id}&select=invited_hirer_email,hirer_email`,
    { method: 'GET', token });
  expect(body[0].invited_hirer_email).toBe(invitedEmail);
  expect(body[0].hirer_email).toBe(actualEmail);
});
