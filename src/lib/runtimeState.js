// src/lib/runtimeState.js
// Per-actor application state, cached in localStorage and mirrored to the
// runtime_snapshots table for cross-device restore.
//
// These snapshots used to live in `events` as type 'runtime.snapshot' — 94% of
// that table — with contract_id set to the literal 'runtime'. They are
// application state, not contractual evidence: no dod_hash, no event_hash, no
// TSA token, and actor_id is often a localStorage device UUID rather than an
// authenticated identity. Keeping them there forced the events read policy to
// carve out a type exception. They now have their own table with a plain
// owner-only policy (20260924000000).

import { supabase } from './supabase.js'
import { getDeviceId } from './identity.js'

const LOCAL_SNAPSHOT_KEY = 'tf_runtime_snapshot_v1'

function readLocalSnapshot() {
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeLocalSnapshot(snapshot) {
  try {
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore quota/storage errors in prototype mode.
  }
}

/**
 * Save runtime snapshot to Supabase (and local cache).
 * @param {object} snapshot - app state to persist
 * @param {string} [actorId] - auth uid or device id; falls back to getDeviceId()
 */
export async function saveRuntimeSnapshot(snapshot, actorId) {
  const resolvedActorId = actorId || getDeviceId()
  const enriched = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  }

  // Always keep local cache for instant restore and offline mode.
  writeLocalSnapshot(enriched)

  if (!supabase) return { source: 'local' }

  const { error } = await supabase.from('runtime_snapshots').insert({
    actor_id: resolvedActorId,
    payload: enriched,
  })

  if (error) {
    console.warn('[TrustFlow] runtime snapshot persist failed:', error.message)
    return { source: 'local', error }
  }

  return { source: 'supabase' }
}

/**
 * Load latest runtime snapshot from Supabase (or local cache).
 * @param {string} [actorId] - auth uid or device id; falls back to getDeviceId()
 */
export async function loadRuntimeSnapshot(actorId) {
  const local = readLocalSnapshot()
  if (!supabase) return local

  const resolvedActorId = actorId || getDeviceId()
  const { data, error } = await supabase
    .from('runtime_snapshots')
    .select('payload,created_at')
    .eq('actor_id', resolvedActorId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.warn('[TrustFlow] runtime snapshot load failed:', error.message)
    return local
  }

  const latest = data && data.length > 0 ? data[0].payload : null
  return latest || local
}
