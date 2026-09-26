import { defineConfig, devices } from '@playwright/test';

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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
