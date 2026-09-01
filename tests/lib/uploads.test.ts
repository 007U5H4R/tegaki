import { describe, expect, it } from 'vitest'
import { allGuardrailsAcked, GUARDRAILS, MAX_FILE_BYTES } from '@/lib/uploads/constants'
import { parseSamplePath, sampleObjectPath } from '@/lib/uploads/paths'
import { validateFile } from '@/lib/uploads/validate'

describe('validateFile', () => {
  const good = { name: 'page-1.jpg', type: 'image/jpeg', size: 2_000_000 }

  it('accepts the three formats a phone or scanner produces', () => {
    for (const type of ['image/jpeg', 'image/png', 'application/pdf']) {
      expect(validateFile({ ...good, type }).ok).toBe(true)
    }
  })

  it('maps each mime to the extension used in the object path', () => {
    expect(validateFile({ ...good, type: 'image/jpeg' })).toMatchObject({ extension: 'jpg' })
    expect(validateFile({ ...good, type: 'image/png' })).toMatchObject({ extension: 'png' })
    expect(validateFile({ ...good, type: 'application/pdf' })).toMatchObject({ extension: 'pdf' })
  })

  it('rejects other formats by name, so the message is actionable', () => {
    const result = validateFile({ name: 'notes.heic', type: 'image/heic', size: 1000 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('notes.heic')
      expect(result.message).toContain('JPG, PNG or PDF')
    }
  })

  it('rejects an oversized file and states both sizes', () => {
    const result = validateFile({ ...good, size: MAX_FILE_BYTES + 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // Someone told only "too large" cannot tell how much smaller to go.
      expect(result.message).toMatch(/20\.0 MB/)
      expect(result.message).toMatch(/limit/)
    }
  })

  it('accepts a file exactly at the limit', () => {
    expect(validateFile({ ...good, size: MAX_FILE_BYTES }).ok).toBe(true)
  })

  it('rejects an empty file', () => {
    expect(validateFile({ ...good, size: 0 }).ok).toBe(false)
  })
})

describe('sample object paths', () => {
  const buyerId = '11111111-1111-4111-8111-111111111111'
  const orderId = '22222222-2222-4222-8222-222222222222'

  it('puts the buyer id first, because every storage policy checks it', () => {
    const path = sampleObjectPath({ buyerId, orderId, version: 1, extension: 'jpg' })
    expect(path.startsWith(`${buyerId}/`)).toBe(true)
  })

  it('carries the order and version, and ends in the right extension', () => {
    const path = sampleObjectPath({ buyerId, orderId, version: 3, extension: 'pdf' })
    expect(path).toContain(`/${orderId}/v3/`)
    expect(path.endsWith('.pdf')).toBe(true)
  })

  it('never reuses the customer’s own filename', () => {
    // Original names leak personal detail more often than people expect.
    const path = sampleObjectPath({ buyerId, orderId, version: 1, extension: 'jpg' })
    const filename = path.split('/').at(-1)!
    expect(filename).toMatch(/^[0-9a-f-]{36}\.jpg$/)
  })

  it('round-trips through parseSamplePath', () => {
    const path = sampleObjectPath({ buyerId, orderId, version: 7, extension: 'png' })
    expect(parseSamplePath(path)).toEqual({ buyerId, orderId, version: 7 })
  })

  it('rejects malformed paths rather than guessing', () => {
    expect(parseSamplePath('too/short.jpg')).toBeNull()
    expect(parseSamplePath('a/b/notaversion/c.jpg')).toBeNull()
    expect(parseSamplePath('a/b/v0/c.jpg')).toBeNull()
    expect(parseSamplePath('a/b/vx/c.jpg')).toBeNull()
    expect(parseSamplePath('')).toBeNull()
  })
})

describe('guardrails', () => {
  const all = Object.fromEntries(GUARDRAILS.map((g) => [g.id, true]))

  it('unlocks only when every point is confirmed', () => {
    expect(allGuardrailsAcked(all)).toBe(true)
  })

  it('stays locked when any single point is missing', () => {
    for (const g of GUARDRAILS) {
      expect(allGuardrailsAcked({ ...all, [g.id]: false })).toBe(false)
    }
  })

  it('fails closed on nothing at all', () => {
    expect(allGuardrailsAcked({})).toBe(false)
    expect(allGuardrailsAcked(null)).toBe(false)
    expect(allGuardrailsAcked(undefined)).toBe(false)
  })

  it('is not satisfied by truthy non-true values', () => {
    const sneaky = Object.fromEntries(GUARDRAILS.map((g) => [g.id, 'yes'])) as unknown as Record<
      string,
      boolean
    >
    expect(allGuardrailsAcked(sneaky)).toBe(false)
  })
})
