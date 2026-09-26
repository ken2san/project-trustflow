// The page under test must talk to the same backend the tests do.
//
// Four live suites drive the browser (contracts-home, earner-signin,
// guest-evidence, invite-persistence) and therefore act through the app loaded
// from the dev server. That server builds VITE_SUPABASE_URL from `.env`, while the
// test process reads `.env.e2e`. Nothing made the two agree, so pointing the tests
// at a separate E2E project would have redirected only the API-level suites and
// left the browser-driven ones still writing into production — silently, and in
// exactly the place the separation exists to protect.
//
// playwright.config.js now passes the credentials into the dev server explicitly.
// This file is the check that it worked, because `reuseExistingServer` means a dev
// server someone already had running — with whatever `.env` gave it — can be the
// one serving these tests, and that server never saw those values.
//
// It is named 00- so it runs first: Playwright orders files alphabetically, and a
// mismatch is worth seeing before 1272 more rows land in the wrong project.

import { test, expect } from '@playwright/test';
import { SUPABASE_URL, LIVE_SKIPPED } from './liveEnv.js';

test.skip(LIVE_SKIPPED,
  'TF_LIVE_E2E=skip — the live-API suites were deliberately disabled.');

test('the app under test is pointed at the same Supabase project as the tests', async ({ page }) => {
  await page.goto('/');

  const appUrl = await page.evaluate(() => window.__TF_SUPABASE_URL__);

  expect(appUrl, [
    'The dev server serving the app was built against a different Supabase project',
    'than the one these tests use.',
    '',
    `  the app is calling: ${appUrl ?? '(none — VITE_SUPABASE_URL was unset)'}`,
    `  the tests expect:   ${SUPABASE_URL}`,
    '',
    'Browser-driven suites would write their data into the app\'s project, not the',
    'tests\'. Most likely a dev server was already running from an earlier shell and',
    'reuseExistingServer picked it up; stop it and let Playwright start its own.',
  ].join('\n')).toBe(SUPABASE_URL);
});
