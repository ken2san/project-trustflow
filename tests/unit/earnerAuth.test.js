import { describe, it, expect, vi, beforeEach } from 'vitest'

// A stand-in for the auth surface the sign-in helpers use.
const auth = {
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
}
vi.mock('../../src/lib/supabase.js', () => ({ supabase: { auth } }))

// vitest runs in the node environment, so localStorage has to be provided.
const store = new Map()
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
}

const {
  requestSignInCode, verifySignInCode, getAuthState, signOutEarner,
  rememberEarnerEmail, recallEarnerEmail,
} = await import('../../src/lib/earnerAuth.js')

beforeEach(() => {
  store.clear()
  for (const fn of Object.values(auth)) fn.mockReset()
})

// ── Requesting a code ───────────────────────────────────────────────────────

describe('requestSignInCode', () => {
  it('never creates an account — this is sign-in, not signup', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    await requestSignInCode('me@example.com')
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'me@example.com',
      options: { shouldCreateUser: false },
    })
  })

  it('trims the address before sending', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null })
    await requestSignInCode('  me@example.com  ')
    expect(auth.signInWithOtp.mock.calls[0][0].email).toBe('me@example.com')
  })

  it('reports an unknown address without claiming the account exists', async () => {
    // Supabase answers an unregistered address with otp_disabled, which is
    // deliberately the same response it gives elsewhere — it does not confirm
    // whether the address is registered, and neither do we.
    auth.signInWithOtp.mockResolvedValue({ error: { code: 'otp_disabled' } })
    expect(await requestSignInCode('nobody@example.com'))
      .toEqual({ ok: false, reason: 'unknown_email' })
  })

  it('distinguishes a send rate limit from a rejected address', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { code: 'over_email_send_rate_limit' } })
    expect((await requestSignInCode('me@example.com')).reason).toBe('rate_limited')

    auth.signInWithOtp.mockResolvedValue({ error: { code: 'email_address_invalid' } })
    expect((await requestSignInCode('me@example.com')).reason).toBe('invalid_email')
  })

  it('refuses an empty address without calling out', async () => {
    expect(await requestSignInCode('   ')).toEqual({ ok: false, reason: 'invalid_email' })
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })
})

// ── Verifying a code ────────────────────────────────────────────────────────

describe('verifySignInCode', () => {
  it('uses the sign-in OTP type, not the address-change one', async () => {
    // 'email_change' is the type used when an anonymous user first claims an
    // address. Same six digits, different verification path — using the wrong
    // one fails with an error that reads like a bad code.
    auth.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1', email: 'me@example.com' } }, error: null })
    await verifySignInCode('me@example.com', '123456')
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'me@example.com', token: '123456', type: 'email',
    })
  })

  it('remembers who signed in, so a later lapse can name them', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1', email: 'me@example.com' } }, error: null })
    await verifySignInCode('me@example.com', '123456')
    expect(recallEarnerEmail()).toBe('me@example.com')
  })

  it('separates a wrong code from an expired one', async () => {
    auth.verifyOtp.mockResolvedValue({ data: null, error: { status: 403, message: 'Token has expired' } })
    expect((await verifySignInCode('me@example.com', '000000')).reason).toBe('expired_code')

    auth.verifyOtp.mockResolvedValue({ data: null, error: { status: 403, message: 'Invalid token' } })
    expect((await verifySignInCode('me@example.com', '000000')).reason).toBe('invalid_code')
  })

  it('does not remember an address that failed to sign in', async () => {
    auth.verifyOtp.mockResolvedValue({ data: null, error: { status: 403, message: 'Invalid token' } })
    await verifySignInCode('typo@example.com', '000000')
    expect(recallEarnerEmail()).toBeNull()
  })
})

// ── Which of the three states this browser is in ────────────────────────────

describe('getAuthState', () => {
  it('reports a verified user as signed in', async () => {
    auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'me@example.com', is_anonymous: false } }, error: null,
    })
    expect(await getAuthState()).toEqual({ status: 'signed_in', email: 'me@example.com', userId: 'u1' })
  })

  it('reports a first-time visitor as anonymous, not expired', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'anon', is_anonymous: true } }, error: null })
    const state = await getAuthState()
    expect(state.status).toBe('anonymous')
    expect(state.email).toBeNull()
  })

  // The distinction that matters: an empty contract list means "make one" for
  // a new user and "your session ended" for a returning one. Getting this
  // wrong tells someone their work is gone.
  it('reports a lapsed session as expired, and remembers whose', async () => {
    rememberEarnerEmail('me@example.com')
    auth.getUser.mockResolvedValue({ data: { user: { id: 'anon', is_anonymous: true } }, error: null })
    const state = await getAuthState()
    expect(state.status).toBe('expired')
    expect(state.email).toBe('me@example.com')
  })

  it('treats no session at all the same way', async () => {
    rememberEarnerEmail('me@example.com')
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } })
    expect((await getAuthState()).status).toBe('expired')
  })
})

describe('signOutEarner', () => {
  it('stops claiming to know who this was', async () => {
    rememberEarnerEmail('me@example.com')
    auth.signOut.mockResolvedValue({})
    await signOutEarner()
    expect(auth.signOut).toHaveBeenCalled()
    expect(recallEarnerEmail()).toBeNull()
  })
})
