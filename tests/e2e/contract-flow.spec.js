// Characterization tests for App.jsx's handleNextStep.
//
// PURPOSE: capture the CURRENT behavior of the contract flow so the upcoming
// UI <-> DB rewiring can tell an intentional change from a regression. These
// assert what the code does today, NOT what it should do — if an assertion
// here looks odd (see the mode-conditional totalEarned at step 4, or that
// step 5 writes `earned: 0` for a Hirer), that oddness is the point. Do not
// "fix" behavior to make a test prettier; change the test only when the
// behavior change is deliberate.
//
// WHY E2E AND NOT UNIT TESTS: handleNextStep lives inside App.jsx and is pure
// side effect (14 setState calls, logEvent, toasts). Unit-testing it would
// need either jsdom + @testing-library (new dependencies, not approved) or a
// hook extraction (deliberately deferred until after the DB rewiring). Driving
// the real UI needs neither — zero production code changed for these tests.
//
// HOW STATE IS OBSERVED: App.jsx persists a runtime snapshot to localStorage
// (`tf_runtime_snapshot_v1`) 900ms after any state change, and that snapshot
// contains exactly the state handleNextStep mutates (step, view, selectedItem,
// uiProfile, contractHistory). Asserting on it is far less brittle than
// scraping rendered numbers out of the DOM.
//
// NOTE: these run against the live Supabase project, as the existing e2e suite
// already does — each run writes a few rows to the `events` table. The contract
// flow itself is not DB-backed (see HANDOFF.md), so nothing else is touched.

import { test, expect } from '@playwright/test';

// Mirrors JOBS_DATA[0] in src/lib/constants.js. 30,000 pts is deliberately
// under the level-1 "Newcomer" contractLimit of 100,000 — above it, step 1's
// button is disabled by the tier gate and the flow cannot be driven at all.
const JOB = {
  id: 3,
  type: 'job',
  title: 'Icon Set Redesign',
  client: 'Indie Studio',
  totalPoints: 30000,
  deadline: '2026-04-01',
  acceptanceCriteria: ['24 Icons Delivered', 'Figma Source File', 'SVG + PNG Exports'],
};

const BASE_PROFILE = {
  points: 1000,
  totalSpent: 0,
  totalEarned: 0,
  completedContracts: 0,
  exp: 0,
  trustScore: 0,
  level: 1,
  avgRating: 4.8,
};

const SNAPSHOT_KEY = 'tf_runtime_snapshot_v1';

/**
 * Start the app already sitting at a given step of the contract flow.
 * Each Playwright test gets a fresh context, so there is no remote snapshot
 * for the new anonymous actor and loadRuntimeSnapshot falls back to this one.
 */
async function seedAt(page, { step, mode = 'earner', uiProfile = {}, contractHistory = [] }) {
  await page.addInitScript(
    ({ key, step, mode, uiProfile, contractHistory, job }) => {
      localStorage.setItem('tf_onboarded', '1');
      localStorage.setItem(key, JSON.stringify({
        hasOnboarded: true,
        mode,
        view: 'contract',
        step,
        selectedItem: job,
        uiProfile,
        contractHistory,
      }));
    },
    { key: SNAPSHOT_KEY, step, mode, uiProfile: { ...BASE_PROFILE, ...uiProfile }, contractHistory, job: JOB },
  );
  await page.goto('/');
}

function readSnapshot(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SNAPSHOT_KEY);
}

/** Waits for the snapshot to satisfy `predicate`, then returns it. */
async function snapshotWhere(page, predicate) {
  await expect.poll(async () => predicate(await readSnapshot(page)), { timeout: 15_000 }).toBe(true);
  return readSnapshot(page);
}

/**
 * HoldButton (steps 1, 2, 4) only arms 500ms after mount and fires onClick
 * once a press has accumulated ~320ms of progress — a plain click does nothing.
 */
async function holdButton(page, name) {
  const button = page.getByRole('button', { name });
  await expect(button).toBeEnabled({ timeout: 15_000 });
  // Let the view's entry animation settle first: while it is still moving, the
  // button slides out from under a stationary cursor, HoldButton's onMouseLeave
  // fires, and the press is silently cancelled with no error.
  await page.waitForTimeout(600);
  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
}

/**
 * Collects the `type` of every event row the app POSTs to Supabase.
 * This is how logEvent's side effect is observed: the on-record badge in the
 * UI can't be used, because it only renders when a dodHash exists, and a
 * seeded snapshot has none (dodHash is computed in beginContract, which these
 * tests deliberately skip). Note the app also writes `runtime.snapshot` rows
 * through the same endpoint, hence filtering by type at the assertion.
 */
function captureLoggedEventTypes(page) {
  const types = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes('/rest/v1/events')) return;
    try {
      const body = JSON.parse(request.postData() ?? 'null');
      for (const row of Array.isArray(body) ? body : [body]) {
        if (row?.type) types.push(row.type);
      }
    } catch {
      // Non-JSON body — not an event insert we care about.
    }
  });
  return types;
}

/**
 * Step 4 opens on a blind-rating form; "Commit & Close" (the handleNextStep
 * trigger) only appears after a rating is submitted, and handleBlindRatingSubmit
 * is a no-op while rating === 0. The partner rating reveals on a 3s timer.
 */
async function submitBlindRating(page) {
  // The 5 rating stars are the only buttons wrapping a lucide star icon
  // (the post-submit "ratings revealed" panel renders stars outside buttons).
  const stars = page.locator('button:has(svg.lucide-star)');
  await expect(stars).toHaveCount(5, { timeout: 15_000 });
  await stars.nth(4).click();
  await page.getByRole('button', { name: /Submit Rating/i }).click();
}

// ── Step 1 ───────────────────────────────────────────────────────────────────

test('step 1: logs contract.accepted and advances to step 2', async ({ page }) => {
  const loggedTypes = captureLoggedEventTypes(page);
  await seedAt(page, { step: 1 });

  await holdButton(page, /Secure Funds in Escrow/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 2);
  expect(snapshot.step).toBe(2);
  // Profile is untouched at step 1 — no points move until step 2.
  expect(snapshot.uiProfile.points).toBe(BASE_PROFILE.points);
  expect(snapshot.uiProfile.completedContracts).toBe(0);
  await expect.poll(() => loggedTypes, { timeout: 10_000 }).toContain('contract.accepted');
});

// ── Step 2 ───────────────────────────────────────────────────────────────────

test('step 2 as Earner: credits the contract amount to points, advances to step 3', async ({ page }) => {
  await seedAt(page, { step: 2, mode: 'earner', uiProfile: { points: 1000 } });

  await holdButton(page, /Enter Build Phase/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 3);
  expect(snapshot.uiProfile.points).toBe(1000 + JOB.totalPoints);
  // Earner branch does not touch totalSpent.
  expect(snapshot.uiProfile.totalSpent).toBe(0);
});

test('step 2 as Hirer: debits points and adds to totalSpent, advances to step 3', async ({ page }) => {
  await seedAt(page, { step: 2, mode: 'hirer', uiProfile: { points: 50_000 } });

  await holdButton(page, /Skip to Next Phase/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 3);
  expect(snapshot.uiProfile.points).toBe(50_000 - JOB.totalPoints);
  expect(snapshot.uiProfile.totalSpent).toBe(JOB.totalPoints);
});

// ── Step 4 ───────────────────────────────────────────────────────────────────

test('step 4 as Earner: logs work.approved, awards completion stats, credits totalEarned, advances to step 5', async ({ page }) => {
  const loggedTypes = captureLoggedEventTypes(page);
  await seedAt(page, {
    step: 4,
    mode: 'earner',
    uiProfile: { completedContracts: 0, exp: 0, trustScore: 0, totalEarned: 0 },
  });

  await submitBlindRating(page);
  await holdButton(page, /Commit & Close/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 5);
  expect(snapshot.uiProfile.completedContracts).toBe(1);
  expect(snapshot.uiProfile.exp).toBe(500);
  expect(snapshot.uiProfile.trustScore).toBe(5);
  // deriveLevel(1) === 1 — level only moves at 3 / 5 / 10 completed contracts.
  expect(snapshot.uiProfile.level).toBe(1);
  expect(snapshot.uiProfile.totalEarned).toBe(JOB.totalPoints);
  await expect.poll(() => loggedTypes, { timeout: 10_000 }).toContain('work.approved');
});

test('step 4 as Hirer: awards the same completion stats but leaves totalEarned alone', async ({ page }) => {
  await seedAt(page, {
    step: 4,
    mode: 'hirer',
    uiProfile: { completedContracts: 0, exp: 0, trustScore: 0, totalEarned: 0 },
  });

  await submitBlindRating(page);
  await holdButton(page, /Commit & Close/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 5);
  // Completion stats are credited regardless of role — characterizing as-is.
  expect(snapshot.uiProfile.completedContracts).toBe(1);
  expect(snapshot.uiProfile.exp).toBe(500);
  expect(snapshot.uiProfile.trustScore).toBe(5);
  // ...but totalEarned is Earner-only.
  expect(snapshot.uiProfile.totalEarned).toBe(0);
});

test('step 4: trustScore is capped at 1000', async ({ page }) => {
  await seedAt(page, { step: 4, mode: 'earner', uiProfile: { trustScore: 998 } });

  await submitBlindRating(page);
  await holdButton(page, /Commit & Close/i);

  const snapshot = await snapshotWhere(page, (s) => s?.step === 5);
  expect(snapshot.uiProfile.trustScore).toBe(1000);
});

// ── Step 5 ───────────────────────────────────────────────────────────────────

test('step 5 as Earner: logs contract.completed, appends a history entry, resets the whole contract view', async ({ page }) => {
  const loggedTypes = captureLoggedEventTypes(page);
  await seedAt(page, { step: 5, mode: 'earner', uiProfile: { avgRating: 4.8 }, contractHistory: [] });

  await page.getByRole('button', { name: /Return to Feed/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'marketplace');
  // Full reset for the next cycle.
  expect(snapshot.step).toBe(1);
  expect(snapshot.selectedItem).toBeNull();
  // One history entry, carrying the contract's identity and the Earner's payout.
  expect(snapshot.contractHistory).toHaveLength(1);
  expect(snapshot.contractHistory[0]).toMatchObject({
    id: String(JOB.id),
    title: JOB.title,
    client: JOB.client,
    earned: JOB.totalPoints,
    rating: 4.8,
  });
  // Date is recorded as YYYY.MM.DD.
  expect(snapshot.contractHistory[0].date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  await expect.poll(() => loggedTypes, { timeout: 10_000 }).toContain('contract.completed');
});

test('step 5 as Hirer: history entry records earned: 0', async ({ page }) => {
  await seedAt(page, { step: 5, mode: 'hirer', contractHistory: [] });

  await page.getByRole('button', { name: /Return to Feed/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'marketplace');
  expect(snapshot.contractHistory).toHaveLength(1);
  expect(snapshot.contractHistory[0].earned).toBe(0);
});

// ── Step 4's email branch (reachable only through the invite flow) ───────────

// The other step 4 tests above seed straight into the step and therefore can
// never exercise `if (isSupabaseEnabled && guestEmail)`: guestEmail is set only
// by accepting an invite, and it is NOT part of the persisted runtime snapshot,
// so it cannot be seeded. This test walks the whole real path instead — generate
// an invite, accept it as the guest, then drive steps 1→4 without reloading
// (a reload would drop guestEmail, which lives in React state only).
test('invite flow sets guestEmail, and step 4 then attempts the acceptance email', async ({ page }) => {
  // Long by necessity: BYOC form, invite acceptance, four hold gestures, the
  // 5s approve-undo window and the 3s rating reveal all happen in one session,
  // because guestEmail cannot survive a reload.
  test.setTimeout(120_000);

  const acceptanceEmailCalls = [];
  page.on('request', (request) => {
    if (request.url().includes('/functions/v1/send-acceptance-email')) {
      acceptanceEmailCalls.push(request.url());
    }
  });

  await page.addInitScript(() => localStorage.setItem('tf_onboarded', '1'));
  await page.goto('/');

  // 1. As the Hirer, generate a real invite link through the BYOC form.
  await page.getByRole('button', { name: /Switch to Hire/i }).click();
  await page.getByRole('button', { name: /I already know who I'm working with/i }).click();
  await page.getByPlaceholder('e.g., Alex Chen / @alexchen').fill('QA Counterparty');
  await page.getByPlaceholder(/Mobile app redesign/i).fill('Characterization run');
  // Under the level-1 tier limit of 100,000, or step 1's button stays disabled.
  await page.getByPlaceholder('e.g., 300000').fill('50000');
  await page.getByPlaceholder(/Definitive Figma Library/i).fill('Deliverable A\nDeliverable B');
  await page.getByRole('button', { name: /Generate Link/i }).click();

  const inviteLink = (await page.locator('p', { hasText: 'token=' }).first().textContent())?.trim();
  expect(inviteLink).toContain('token=');

  // 2. Open the invite as the guest and accept it — this is the only path that
  //    sets guestEmail.
  await page.goto(inviteLink);
  await page.getByRole('button', { name: /Review Agreement/i }).click();
  await page.getByPlaceholder(/Your name or handle/i).fill('QA Guest');
  await page.getByPlaceholder(/Email address/i).fill('qa-guest@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /I Agree/i }).click();

  // 3. Acceptance lands on the scoping view; start the contract from there.
  //    (Scoping renders Initiate Contract as a hold button, unlike the
  //    project-detail path the existing suite drives with a plain click.)
  await holdButton(page, /Initiate Contract/i);
  const confirmButton = page.getByRole('button', { name: /^Confirm$/ });
  if (await confirmButton.isVisible().catch(() => false)) await confirmButton.click();

  // 4. Walk to step 4. Labels differ by role, hence the alternations.
  await holdButton(page, /Secure Funds in Escrow/i);
  await holdButton(page, /Skip to Next Phase|Enter Build Phase/i);
  // Step 3 doesn't advance on the hold alone: it opens an "Approve Deliverable"
  // dialog, and handleNextStep only fires after the 5-second undo window that
  // "Confirm Approve" starts.
  await holdButton(page, /Release Funds/i);
  await page.getByRole('button', { name: /Confirm Approve/i }).click();
  await expect(page.getByRole('button', { name: /Undo/i })).toBeHidden({ timeout: 20_000 });
  await submitBlindRating(page);
  await holdButton(page, /Commit & Close/i);

  // The observable side effect: the app attempts the acceptance email.
  // Only the outbound attempt is asserted — whether it succeeds depends on the
  // deployed function and on the contract existing in the DB, which this
  // local/demo flow's contract does not (see HANDOFF.md), so today it 404s and
  // the app surfaces an "Email not sent" toast. That outcome is deployment
  // state, not app behavior, so it is deliberately not asserted here.
  await expect.poll(() => acceptanceEmailCalls.length, { timeout: 20_000 }).toBeGreaterThan(0);
});

test('step 5: prepends to existing history rather than replacing it', async ({ page }) => {
  const existing = { id: 'TX-OLD', title: 'Previous Contract', client: 'Old Client', date: '2026.01.01', earned: 5000, rating: 5 };
  await seedAt(page, { step: 5, mode: 'earner', contractHistory: [existing] });

  await page.getByRole('button', { name: /Return to Feed/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'marketplace');
  expect(snapshot.contractHistory).toHaveLength(2);
  expect(snapshot.contractHistory[0].id).toBe(String(JOB.id));
  expect(snapshot.contractHistory[1]).toMatchObject(existing);
});
