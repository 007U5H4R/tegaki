/**
 * The three service tiers — Solution-PRD §5, verbatim.
 *
 * One source for prices, turnarounds and contents, consumed by the landing
 * page, the wizard and the dashboard alike. A price that appears in three
 * files is a price that will eventually disagree with itself.
 *
 * Prices are display-only for the pilot: checkout is demo mode and takes no
 * real payment (§5, and the notice is repeated at the checkout step itself).
 */

export const TIERS = ['express', 'core', 'comprehensive'] as const
export type Tier = (typeof TIERS)[number]

export type TierDetail = {
  id: Tier
  name: string
  /** Whole rupees. Formatted for display by formatPrice. */
  priceInr: number
  /** Days from sample APPROVAL, not from payment (§6.6). */
  turnaroundDays: number
  pages: string
  /** Shown as the card's bullet list. Outcome-led, not feature-led. */
  contents: readonly string[]
  /** Exactly one tier may be anchored, or the anchor stops meaning anything. */
  popular?: boolean
}

export const TIER_DETAILS: Record<Tier, TierDetail> = {
  express: {
    id: 'express',
    name: 'Express Insight',
    priceInr: 999,
    turnaroundDays: 3,
    pages: '1–2 pages',
    contents: [
      'Executive summary',
      'Six-trait dashboard',
      'Your top three strengths',
      'One development insight',
      'A note on your signature',
    ],
  },
  core: {
    id: 'core',
    name: 'Core Personality',
    priceInr: 1999,
    turnaroundDays: 5,
    pages: '3–5 pages',
    popular: true,
    contents: [
      'Full ten to twelve trait dashboard',
      'Your personality archetype',
      'Five core sections, from foundation to emotional awareness',
      'Strengths profile and development opportunities',
      'Signature compared with your everyday writing',
    ],
  },
  comprehensive: {
    id: 'comprehensive',
    name: 'Comprehensive Profile',
    priceInr: 2999,
    turnaroundDays: 7,
    pages: '6+ pages',
    contents: [
      'All sixteen assessment sections',
      'MBTI correlation, indicative',
      'Trait radar chart',
      'How your signature reads in public',
      'Priority follow-up by email',
    ],
  },
}

export const TIER_LIST: readonly TierDetail[] = TIERS.map((t) => TIER_DETAILS[t])

/** ₹1,999 — Indian digit grouping, which is not the same as Western grouping. */
export function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(priceInr)
}

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value)
}

/**
 * The delivery date promised for a tier, counted from sample approval.
 * The clock deliberately does not start at checkout: an unusable photo would
 * otherwise burn days of a promise nobody could keep (§6.6).
 */
export function expectedDeliveryDate(tier: Tier, approvedAt: Date): Date {
  const due = new Date(approvedAt)
  due.setDate(due.getDate() + TIER_DETAILS[tier].turnaroundDays)
  return due
}
