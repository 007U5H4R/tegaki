import { describe, expect, it } from 'vitest'
import { resolveRole } from '@/lib/auth/role'

const ALLOWLIST = 'tushar@example.com, admin2@example.com'

describe('resolveRole', () => {
  it('grants admin to an allowlisted address', () => {
    expect(resolveRole('tushar@example.com', ALLOWLIST)).toBe('admin')
    expect(resolveRole('admin2@example.com', ALLOWLIST)).toBe('admin')
  })

  it('defaults everyone else to buyer', () => {
    expect(resolveRole('stranger@example.com', ALLOWLIST)).toBe('buyer')
  })

  it('ignores casing and surrounding whitespace on both sides', () => {
    expect(resolveRole('  Tushar@Example.COM ', ALLOWLIST)).toBe('admin')
    expect(resolveRole('admin2@example.com', ' TUSHAR@example.com ,admin2@example.com ')).toBe(
      'admin',
    )
  })

  it('fails closed when the allowlist is missing or empty', () => {
    expect(resolveRole('tushar@example.com', undefined)).toBe('buyer')
    expect(resolveRole('tushar@example.com', '')).toBe('buyer')
    expect(resolveRole('tushar@example.com', '   ')).toBe('buyer')
  })

  it('fails closed on a missing email rather than matching a blank entry', () => {
    // A trailing comma leaves an empty slot; a null email must not match it.
    expect(resolveRole(null, 'tushar@example.com,')).toBe('buyer')
    expect(resolveRole(undefined, ',,')).toBe('buyer')
    expect(resolveRole('', ',,')).toBe('buyer')
    expect(resolveRole('   ', 'tushar@example.com,')).toBe('buyer')
  })

  it('does not treat a substring of an allowlisted address as a match', () => {
    expect(resolveRole('ushar@example.com', ALLOWLIST)).toBe('buyer')
    expect(resolveRole('tushar@example.com.evil.test', ALLOWLIST)).toBe('buyer')
  })
})
