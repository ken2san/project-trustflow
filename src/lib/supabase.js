// src/lib/supabase.js
// Supabase client singleton.
// Falls back to null when env vars are not set (mock/dev mode — app still works).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export const isSupabaseEnabled = Boolean(supabase)

// Which backend this bundle was built against, readable from the page.
//
// The browser-driving E2E suites load the app from the dev server, and that
// server builds VITE_SUPABASE_URL from .env — not from the .env.e2e the test
// process reads. The two can therefore disagree, and when they do the tests write
// their data into whichever project .env happens to name. tests/e2e/00-backend-guard
// asserts this value instead of assuming. No new exposure: the URL is already in
// the bundle and on every request it makes.
if (typeof window !== 'undefined') window.__TF_SUPABASE_URL__ = url ?? null
