// A single verified-Earner session, shared by every suite that needs one.
//
// Five suites run against the live API and each used to open its own session.
// Combined with the anonymous sign-in the app performs on every page load, a
// full run pushed enough traffic at Supabase Auth to start timing out token
// grants — which failed tests that had nothing to do with authentication.
//
// The session is cached on disk and reused until it is close to expiry, so a
// whole run normally costs one grant rather than five. The file holds a live
// access token, so it is gitignored alongside the anonymous fixture.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE = process.env.TF_TEST_EARNER_SESSION
  ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '.earner-session.json');

/** Re-grant this far before the token actually expires. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

let inFlight = null;

function unexpired(session) {
  if (!session?.access_token || !session?.expires_at) return false;
  return session.expires_at * 1000 - Date.now() > REFRESH_MARGIN_MS;
}

/**
 * An unexpired token is not necessarily a live one: signing out revokes the
 * session behind it, and the JWT then fails with session_not_found while still
 * looking valid by its own expiry. Checking costs one request per run and
 * lets a poisoned cache heal itself instead of failing every suite after it.
 */
async function stillLive(request, session, url, key) {
  const response = await request.fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
  });
  return response.status() === 200;
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{ token: string, userId: string, session: object }>}
 */
export async function getEarnerSession(request) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.TF_TEST_EARNER_EMAIL;
  const password = process.env.TF_TEST_EARNER_PASSWORD;

  inFlight ??= (async () => {
    try {
      const cached = JSON.parse(await readFile(CACHE, 'utf8'));
      if (unexpired(cached) && await stillLive(request, cached, url, key)) return cached;
    } catch { /* no cache, unreadable, or unreachable */ }

    const response = await request.fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      data: { email, password },
    });
    const session = await response.json();
    if (response.status() !== 200) {
      throw new Error(`earner sign-in failed (${response.status()}): ${JSON.stringify(session)}`);
    }
    await writeFile(CACHE, JSON.stringify(session, null, 2));
    return session;
  })();

  const session = await inFlight;
  return { token: session.access_token, userId: session.user.id, session };
}
