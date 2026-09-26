// The credentials the live-API suites need, and a refusal to run without them.
//
// WHY THIS FILE EXISTS
// Every live suite used to read the four variables itself and call
//
//   test.skip(!CONFIGURED, 'Set VITE_SUPABASE_URL, … to run this suite.')
//
// which meant that a missing credential produced a green run. On 2026-09-25 the
// atomic-acceptance suite reported "10 skipped" and exited 0; the code it was
// written to guard had two faults that broke acceptance completely in production.
// A suite that cannot run is not a suite that passed, and the exit code has to
// say so.
//
// So the default is now the opposite: absent credentials are an error, loudly,
// before any test starts. Skipping is still available, but only by asking for it
// — TF_LIVE_E2E=skip — because an explicit opt-out appears in the command that
// chose it, while a missing file appears nowhere.
//
// It also loads .env.e2e itself. Previously each run depended on the operator
// remembering `set -a && . ./.env.e2e && set +a`, and forgetting it produced
// exactly the silent skip above. Real environment variables still win, so CI can
// supply them without the file existing at all.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Where the local credentials live. Overridable so CI can point elsewhere. */
export const ENV_FILE = process.env.TF_E2E_ENV_FILE
  ?? path.join(REPO_ROOT, '.env.e2e');

const REQUIRED = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'TF_TEST_EARNER_EMAIL',
  'TF_TEST_EARNER_PASSWORD',
];

/**
 * Minimal KEY=VALUE reader: enough for a file this project writes itself, and
 * not a reason to add a dependency. Only fills variables that are not already
 * set, so an explicit environment always wins over the file.
 */
function loadEnvFile(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return false; // absent is normal; whether that matters is decided below
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (value.length > 1 && (value.startsWith('"') || value.startsWith("'"))
        && value.endsWith(value[0])) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return true;
}

const fileFound = loadEnvFile(ENV_FILE);
const missing = REQUIRED.filter(key => !process.env[key]);

/**
 * True only when the operator asked for the live suites to be skipped. Never
 * true merely because something is missing.
 */
export const LIVE_SKIPPED = process.env.TF_LIVE_E2E === 'skip';

/** Kept for the suites that branch on it rather than only skipping. */
export const CONFIGURED = missing.length === 0;

if (missing.length > 0 && !LIVE_SKIPPED) {
  throw new Error([
    '',
    'The live-API E2E suites cannot run: credentials are missing.',
    '',
    `  missing: ${missing.join(', ')}`,
    `  ${fileFound ? 'read' : 'looked for'} ${ENV_FILE}${fileFound ? '' : ' — not found'}`,
    '',
    'This is an error and not a skip on purpose. A skipped live suite exits 0,',
    'which is how the atomic-acceptance suite went unexecuted while the code it',
    'guards was broken in production (2026-09-25).',
    '',
    'Supply the credentials — .env.e2e holds them locally and is loaded',
    'automatically — or, to run only the local suites, say so explicitly:',
    '',
    '  TF_LIVE_E2E=skip npx playwright test',
    '',
  ].join('\n'));
}

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
export const EARNER_EMAIL = process.env.TF_TEST_EARNER_EMAIL;
export const EARNER_PASSWORD = process.env.TF_TEST_EARNER_PASSWORD;
