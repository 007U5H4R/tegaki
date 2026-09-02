/**
 * Sentences the product must not say differently in different places.
 *
 * Two of these are promises rather than copy. The disclaimer is the
 * indicative-claims guardrail the whole product is written to (Solution-PRD
 * §2, Design.md §5.2): graphology here is a growth tool, never a diagnosis,
 * and that has to read identically wherever someone meets it.
 *
 * The pilot notices are the other. Taking an order without taking money is
 * only honest if it is unmissable — so the wording lives here once and
 * appears at checkout, on the confirmed order, and nowhere in a weakened
 * form.
 */

export const DISCLAIMER = 'Insights are indicative and growth-oriented — never diagnostic.'

export const PILOT_NOTICE_TITLE = 'Pilot mode — no real payment is taken.'
export const PILOT_NOTICE_BODY = 'Your order is confirmed instantly.'

/** Shown on an order after it has been placed. */
export const PILOT_ORDER_NOTE = 'Pilot order — no payment was taken.'

/** Stated at the tiers and again at checkout (Design.md §1). */
export const RISK_REVERSAL = 'Sample not usable? Full refund.'

/**
 * Where a customer reaches a human.
 *
 * Solution-PRD §6.4 makes this the escape hatch for a parked order — the one
 * state with no button that moves it forward, so it must not be a dead end.
 *
 * This is Tushar's own address, which is what the PRD specifies: the pilot
 * has no support infrastructure and no custom domain, and pretending
 * otherwise would be worse than being plain about it. The WhatsApp
 * deep-link the PRD also mentions is NOT here — it needs a phone number
 * nobody has given, and a broken link is worse than one honest channel.
 */
export const CONTACT_EMAIL = 'snowreaderofficial@gmail.com'
