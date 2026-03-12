// src/lib/supabase.js
// Supabase client singleton.
// Falls back to null when env vars are not set (mock/dev mode — app still works).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export const isSupabaseEnabled = Boolean(supabase)
