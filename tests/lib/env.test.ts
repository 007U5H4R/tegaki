import { afterEach, describe, expect, it, vi } from 'vitest'
import { supabasePublishableKey, supabaseSecretKey, supabaseUrl } from '@/lib/supabase/env'

const REAL_URL = 'https://abcdefghijklm.supabase.co'
const REAL_PUBLISHABLE = 'sb_publishable_abc123'
const REAL_SECRET = 'sb_secret_abc123'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('supabaseUrl', () => {
  it('accepts a real project URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', REAL_URL)
    expect(supabaseUrl()).toBe(REAL_URL)
  })

  it('strips a trailing slash, which supabase-js would double up', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', `${REAL_URL}/`)
    expect(supabaseUrl()).toBe(REAL_URL)
  })

  it('rejects the placeholder from .env.example', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://<project-ref>.supabase.co')
    expect(() => supabaseUrl()).toThrow(/placeholder/i)
  })

  it('rejects a missing or blank value', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    expect(() => supabaseUrl()).toThrow(/Missing environment variable/)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '   ')
    expect(() => supabaseUrl()).toThrow(/Missing environment variable/)
  })

  it('rejects something that is not a URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-url')
    expect(() => supabaseUrl()).toThrow(/not a valid URL/)
  })

  it('rejects plain http for a remote host, but allows localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://abcdefghijklm.supabase.co')
    expect(() => supabaseUrl()).toThrow(/must be https/)

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    expect(supabaseUrl()).toBe('http://localhost:54321')
  })
})

describe('supabasePublishableKey', () => {
  it('accepts a publishable key and a legacy anon JWT', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', REAL_PUBLISHABLE)
    expect(supabasePublishableKey()).toBe(REAL_PUBLISHABLE)

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'eyJhbGciOiJIUzI1NiJ9.legacy')
    expect(supabasePublishableKey()).toBe('eyJhbGciOiJIUzI1NiJ9.legacy')
  })

  it('catches a secret key put where the browser would receive it', () => {
    // The worst realistic misconfiguration in the whole project.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', REAL_SECRET)
    expect(() => supabasePublishableKey()).toThrow(/SECRET key/)
    expect(() => supabasePublishableKey()).toThrow(/rotate it/)
  })

  it('rejects a value of the wrong shape entirely', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'hunter2')
    expect(() => supabasePublishableKey()).toThrow(/does not look like a Supabase key/)
  })
})

describe('supabaseSecretKey', () => {
  it('accepts a secret key', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', REAL_SECRET)
    expect(supabaseSecretKey()).toBe(REAL_SECRET)
  })

  it('catches the publishable key in the privileged slot', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', REAL_PUBLISHABLE)
    expect(() => supabaseSecretKey()).toThrow(/publishable key/)
  })

  it('rejects the placeholder', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_<...>')
    expect(() => supabaseSecretKey()).toThrow(/placeholder/i)
  })
})
