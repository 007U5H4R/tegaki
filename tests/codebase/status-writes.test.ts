import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TRANSITIONS } from '@/lib/orders/transitions'
import { ORDER_STATUSES } from '@/lib/orders/status'

/**
 * Every status change goes through the SQL functions. This test is what
 * notices if one ever stops.
 *
 * Three things already enforce it at runtime: `status` is absent from the
 * UPDATE grant, no RLS policy permits writing it, and `transition_order()`
 * owns every edge. This adds the fourth kind of check — the one that fails in
 * review rather than in production — because the failure mode it guards
 * against is somebody adding `.update({ status })` in a hurry and it *only*
 * failing at runtime, on a path nobody exercises until a customer does.
 *
 * Crude by design. A grep is not a type system, but the thing it is looking
 * for is a literal string, and the alternative is trusting that nobody will
 * write it.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(ts|tsx)$/.test(path) ? [path] : []
  })
}

describe('no application code writes an order status', () => {
  it('never updates orders.status outside the SQL functions', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const source = readFileSync(file, 'utf8')

      // `.update({ ... status ... })` anywhere near an orders query. Matching
      // the shape rather than a whole expression keeps it readable and errs
      // toward false positives, which is the right way round for this.
      const updates = source.matchAll(/\.update\(\s*\{([^}]*)\}/g)
      for (const match of updates) {
        const fields = match[1] ?? ''
        if (/\bstatus\b/.test(fields)) {
          offenders.push(`${file.replace(SRC, 'src')} — .update({ …status… })`)
        }
      }
    }

    expect(
      offenders,
      'status is the state machine’s to write. Use transition_order() through a server action.',
    ).toEqual([])
  })

  it('never writes the stamps the review owns either', () => {
    // approved_at, delivered_at and the rest are stamped by definer functions
    // for the same reason: they are promises to a customer, not fields.
    const owned = [
      'approved_at',
      'expected_delivery_date',
      'rejected_at',
      'reupload_deadline',
      'delivered_at',
      'validated_at',
      'submitted_at',
    ]
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\.update\(\s*\{([^}]*)\}/g)) {
        const fields = match[1] ?? ''
        for (const column of owned) {
          if (new RegExp(`\\b${column}\\b`).test(fields)) {
            offenders.push(`${file.replace(SRC, 'src')} — .update({ …${column}… })`)
          }
        }
      }
    }

    expect(offenders).toEqual([])
  })
})

describe('the transition matrix the UI generates from', () => {
  it('names only statuses the product actually has', () => {
    for (const t of TRANSITIONS) {
      expect(ORDER_STATUSES, `unknown status ${t.from}`).toContain(t.from)
      expect(ORDER_STATUSES, `unknown status ${t.to}`).toContain(t.to)
    }
  })

  it('has no duplicate edges', () => {
    const seen = TRANSITIONS.map((t) => `${t.from}->${t.to}`)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('gives every admin-pressable edge a label and a consequence', () => {
    // A confirm dialog that does not say what the click costs is a dialog
    // that only slows somebody down.
    for (const t of TRANSITIONS.filter((t) => t.label)) {
      expect(t.by, `${t.from} → ${t.to} is labelled, so it must be the analyst's`).toBe('admin')
      expect(t.consequence, `${t.from} → ${t.to} needs a consequence`).toBeTruthy()
    }
  })

  it('leaves completing unlabelled, because attaching the report is what completes an order', () => {
    const complete = TRANSITIONS.find((t) => t.to === 'completed')
    expect(
      complete?.label,
      'a button here would allow a completed order with no report',
    ).toBeUndefined()
  })
})
