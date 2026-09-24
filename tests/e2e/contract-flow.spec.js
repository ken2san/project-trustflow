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
 * Collects the `type` of every event the app asks the server to record.
 * This is how logEvent's side effect is observed: the on-record badge in the
 * UI can't be used, because it only renders when a dodHash exists, and a
 * seeded snapshot has none (dodHash is computed in beginContract, which these
 * tests deliberately skip).
 *
 * The target is the log-event Edge Function, not a PostgREST insert: since
 * 20260924000002 the client has no INSERT privilege on `events` at all, and
 * what it sends is a request to record, not the record itself. Runtime
 * snapshots no longer come through here either — they go to their own table.
 */
function captureLoggedEventTypes(page) {
  const types = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes('/functions/v1/log-event')) return;
    try {
      const body = JSON.parse(request.postData() ?? 'null');
      if (body?.type) types.push(body.type);
    } catch {
      // Non-JSON body — not an ingestion request we care about.
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

  await page.getByRole('button', { name: /Return to Contracts/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'home');
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

  await page.getByRole('button', { name: /Return to Contracts/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'home');
  expect(snapshot.contractHistory).toHaveLength(1);
  expect(snapshot.contractHistory[0].earned).toBe(0);
});

// ── Step 4's email branch — no longer reachable, test removed ───────────────
//
// A test used to characterize `if (isSupabaseEnabled && guestEmail)` at step 4
// by walking the old client-side invite: BYOC -> "Generate Link" -> accept ->
// guestEmail set -> land in the numeric-step contract flow -> drive to step 4.
//
// That path no longer exists. Invites are now server-issued and DB-backed, and
// accepting one ends on the acceptance confirmation screen instead of entering
// the local numeric-step flow, so nothing reaches step 4 with guestEmail set.
// The branch is currently dead code rather than untested behaviour; it is left
// in App.jsx because the UI <-> DB wiring phase will decide what replaces it.
// The rest of step 4 stays covered by the seeded tests above.

test('step 5: prepends to existing history rather than replacing it', async ({ page }) => {
  const existing = { id: 'TX-OLD', title: 'Previous Contract', client: 'Old Client', date: '2026.01.01', earned: 5000, rating: 5 };
  await seedAt(page, { step: 5, mode: 'earner', contractHistory: [existing] });

  await page.getByRole('button', { name: /Return to Contracts/i }).click();

  const snapshot = await snapshotWhere(page, (s) => s?.view === 'home');
  expect(snapshot.contractHistory).toHaveLength(2);
  expect(snapshot.contractHistory[0].id).toBe(String(JOB.id));
  expect(snapshot.contractHistory[1]).toMatchObject(existing);
});
