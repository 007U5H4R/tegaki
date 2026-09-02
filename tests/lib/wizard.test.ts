import { describe, expect, it } from 'vitest'
import { clampSegment, segmentIndex, wizardPath, WIZARD_SEGMENTS } from '@/lib/orders/wizard'
import { collectErrors, stage1Schema } from '@/lib/orders/wizard-schema'

const validSelf = {
  fullName: 'Asha Menon',
  age: '34',
  gender: '',
  city: 'Kochi',
  country: 'India',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  whatsappPreferred: true,
  subjectIsSelf: true,
  subjectName: '',
  subjectAge: '',
  consent: false,
}

describe('stage 1 validation', () => {
  it('accepts a complete self-assessment', () => {
    const result = stage1Schema.safeParse(validSelf)
    expect(result.success).toBe(true)
  })

  it('coerces the age to a number so the database gets an int', () => {
    const result = stage1Schema.safeParse(validSelf)
    expect(result.success && result.data.age).toBe(34)
  })

  it('accepts the many shapes an Indian phone number is written in', () => {
    for (const phone of ['+91 98765 43210', '09876543210', '9876543210', '+91-98765-43210']) {
      expect(stage1Schema.safeParse({ ...validSelf, phone }).success, phone).toBe(true)
    }
  })

  it('rejects a phone number containing letters', () => {
    expect(stage1Schema.safeParse({ ...validSelf, phone: 'call me' }).success).toBe(false)
  })

  it('rejects an age below five, since younger handwriting is not yet formed', () => {
    expect(stage1Schema.safeParse({ ...validSelf, age: '4' }).success).toBe(false)
  })

  it('requires a real email address', () => {
    expect(stage1Schema.safeParse({ ...validSelf, email: 'asha at example' }).success).toBe(false)
  })

  it('leaves gender optional, and does not constrain it to a list', () => {
    expect(stage1Schema.safeParse({ ...validSelf, gender: '' }).success).toBe(true)
    expect(stage1Schema.safeParse({ ...validSelf, gender: 'non-binary' }).success).toBe(true)
  })
})

describe('the consent gate', () => {
  const forSomeoneElse = {
    ...validSelf,
    subjectIsSelf: false,
    subjectName: 'Rahul Menon',
    subjectAge: '12',
  }

  it('accepts an assessment for someone else once consent is confirmed', () => {
    expect(stage1Schema.safeParse({ ...forSomeoneElse, consent: true }).success).toBe(true)
  })

  it('refuses it without consent, and explains why', () => {
    const result = stage1Schema.safeParse({ ...forSomeoneElse, consent: false })
    expect(result.success).toBe(false)

    if (!result.success) {
      const errors = collectErrors(result.error)
      expect(errors.consent).toBeTruthy()
      // The message has to carry the reason: the person being written about
      // is not in the room to object.
      expect(errors.consent).toMatch(/permission/i)
    }
  })

  it('requires the subject’s name and age when it is not the buyer', () => {
    const result = stage1Schema.safeParse({
      ...forSomeoneElse,
      subjectName: '',
      subjectAge: '',
      consent: true,
    })
    expect(result.success).toBe(false)

    if (!result.success) {
      const errors = collectErrors(result.error)
      expect(errors.subjectName).toBeTruthy()
      expect(errors.subjectAge).toBeTruthy()
    }
  })

  it('does not demand consent when the handwriting is the buyer’s own', () => {
    expect(stage1Schema.safeParse({ ...validSelf, consent: false }).success).toBe(true)
  })

  it('reports one message per field, so the form is not a wall of text', () => {
    const result = stage1Schema.safeParse({
      ...forSomeoneElse,
      fullName: '',
      email: 'nope',
      consent: false,
    })
    expect(result.success).toBe(false)

    if (!result.success) {
      const errors = collectErrors(result.error)
      expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'fullName'])
    }
  })
})

describe('resuming the wizard', () => {
  it('sends someone back to the furthest stage they actually reached', () => {
    expect(clampSegment('checkout', 1)).toBe('profile')
    expect(clampSegment('checkout', 2)).toBe('upload')
    expect(clampSegment('tier', 2)).toBe('upload')
  })

  it('allows going back to review an earlier stage', () => {
    expect(clampSegment('profile', 4)).toBe('profile')
    expect(clampSegment('upload', 3)).toBe('upload')
  })

  it('lets someone reach the stage they are actually on', () => {
    WIZARD_SEGMENTS.forEach((segment, i) => {
      expect(clampSegment(segment, i + 1)).toBe(segment)
    })
  })

  it('survives a nonsensical stored stage rather than crashing', () => {
    // A corrupt or out-of-range value should degrade to somewhere safe.
    expect(clampSegment('checkout', 0)).toBe('profile')
    expect(clampSegment('checkout', -5)).toBe('profile')
    expect(clampSegment('profile', 99)).toBe('profile')
    expect(clampSegment('checkout', 99)).toBe('checkout')
  })

  it('builds stage paths from the order id', () => {
    expect(wizardPath('abc', 'upload')).toBe('/wizard/abc/upload')
    expect(segmentIndex('tier')).toBe(2)
  })
})
