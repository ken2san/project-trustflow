import { supabase } from './supabase.js'

const DEVICE_ID_KEY = 'tf_device_id'
const LOCAL_SNAPSHOT_KEY = 'tf_runtime_snapshot_v1'

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

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

export async function saveRuntimeSnapshot(snapshot) {
  const enriched = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  }

  // Always keep local cache for instant restore and offline mode.
  writeLocalSnapshot(enriched)

  if (!supabase) return { source: 'local' }

  const actorId = getDeviceId()
  const { error } = await supabase.from('events').insert({
    type: 'runtime.snapshot',
    contract_id: 'runtime',
    actor_id: actorId,
    payload: enriched,
    dod_hash: null,
  })

  if (error) {
    console.warn('[TrustFlow] runtime snapshot persist failed:', error.message)
    return { source: 'local', error }
  }

  return { source: 'supabase' }
}

export async function loadRuntimeSnapshot() {
  const local = readLocalSnapshot()
  if (!supabase) return local

  const actorId = getDeviceId()
  const { data, error } = await supabase
    .from('events')
    .select('payload,created_at')
    .eq('type', 'runtime.snapshot')
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.warn('[TrustFlow] runtime snapshot load failed:', error.message)
    return local
  }

  const latest = data && data.length > 0 ? data[0].payload : null
  return latest || local
}
