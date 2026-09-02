/**
 * Wizard navigation rules — Solution-PRD §6.3.
 *
 * Progress is stored on the order (`wizard_stage`), not in the browser, so
 * someone can start on a phone, get interrupted, and finish on a laptop.
 * That is not a nicety for this product: gathering two pages of handwriting
 * and three signatures is an away-from-the-screen task, so leaving and
 * coming back is the normal path rather than the exception.
 */

export const WIZARD_STEPS = ['Profile', 'Sample', 'Tier', 'Confirm'] as const

export const WIZARD_SEGMENTS = ['profile', 'upload', 'tier', 'checkout'] as const
export type WizardSegment = (typeof WIZARD_SEGMENTS)[number]

export function segmentIndex(segment: WizardSegment): number {
  return WIZARD_SEGMENTS.indexOf(segment)
}

/**
 * Where a visitor is allowed to be, given how far they have actually got.
 *
 * Going back is always fine — reviewing what you entered is reasonable.
 * Jumping ahead is not, because a later stage would render with nothing to
 * work from and fail confusingly rather than helpfully.
 */
export function clampSegment(requested: WizardSegment, furthestStage: number): WizardSegment {
  const furthestIndex = Math.min(Math.max(furthestStage, 1), WIZARD_SEGMENTS.length) - 1
  const requestedIndex = segmentIndex(requested)
  return WIZARD_SEGMENTS[Math.min(requestedIndex, furthestIndex)]!
}

export function wizardPath(orderId: string, segment: WizardSegment): string {
  return `/wizard/${orderId}/${segment}`
}
