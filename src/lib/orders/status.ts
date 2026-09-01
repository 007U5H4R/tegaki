/**
 * The order lifecycle — Solution-PRD §6.6, verbatim.
 *
 * This is the single client-side source of truth for status names and the
 * copy shown to customers. The authoritative machine lives in Postgres
 * (`transition_order()`), which owns every edge; this file must never grow a
 * state the database does not know about.
 */

export const ORDER_STATUSES = [
  'draft',
  'sample_under_review',
  'needs_reupload',
  'analysis_in_progress',
  'report_generating',
  'completed',
  'parked',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/**
 * Customer-facing labels. Short enough for a chip, and written in the PRD's
 * indicative voice — "Needs another try" rather than "REJECTED", because the
 * customer did not fail an exam, their photo was blurry.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  sample_under_review: 'Sample under review',
  needs_reupload: 'Needs another try',
  analysis_in_progress: 'Analysis in progress',
  report_generating: 'Report in production',
  completed: 'Ready',
  parked: 'Parked',
}

/** The four nodes of the customer-facing progress rail (Design.md §3.6). */
export const RAIL_STEPS = ['Sample review', 'Analysis', 'Report', 'Delivered'] as const

/**
 * How far along the rail a status sits. `needs_reupload` and `parked` are
 * deliberately absent: they replace the rail with their own panel rather than
 * showing progress, because a stalled order pretending to advance is a lie.
 */
export const RAIL_POSITION: Partial<Record<OrderStatus, number>> = {
  sample_under_review: 0,
  analysis_in_progress: 1,
  report_generating: 2,
  completed: 3,
}
