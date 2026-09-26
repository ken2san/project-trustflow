import { defineConfig, devices } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_KEY } from './tests/e2e/liveEnv.js';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  // 'list' prints the run; noSilentSkip decides whether an empty one counts as a
  // pass. Playwright exits 0 when every test is skipped, which is precisely the
  // failure this project already shipped a production bug through.
  reporter: [['list'], ['./tests/reporters/noSilentSkip.js']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Skip onboarding via localStorage mock
    storageState: { cookies: [], origins: [] },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 15_000,
    // The app under test must reach the same Supabase project the tests do.
    // Vite would otherwise take these from .env, which is a different file from
    // the .env.e2e the tests read — so a separate E2E project would redirect the
    // API-level suites and leave the browser-driven ones writing to production.
    // reuseExistingServer means this can still be bypassed by a server that was
    // already up, which is what tests/e2e/00-backend-guard.spec.js checks.
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: SUPABASE_KEY ?? '',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
