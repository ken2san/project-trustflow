import { supabase } from './supabase.js'

const DEVICE_ID_KEY = 'tf_device_id'

export function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

export async function ensureActorIdentity() {
  const fallback = getDeviceId()
  if (!supabase) return { actorId: fallback, source: 'local' }

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id
    if (currentUserId) return { actorId: currentUserId, source: 'supabase-auth' }

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn('[TrustFlow] anonymous auth unavailable, using local actor id:', error.message)
      return { actorId: fallback, source: 'local' }
    }

    const anonUserId = data?.user?.id
    return { actorId: anonUserId || fallback, source: anonUserId ? 'supabase-auth' : 'local' }
  } catch (err) {
    console.warn('[TrustFlow] identity bootstrap failed, using local actor id:', err?.message || String(err))
    return { actorId: fallback, source: 'local' }
  }
}
