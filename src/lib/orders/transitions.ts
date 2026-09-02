import type { OrderStatus } from './status'

/**
 * Every legal move an order can make — Solution-PRD §6.6.
 *
 * This mirrors the edge list inside `transition_order()`. The database is
 * still the authority: it checks the caller and the preconditions, and it is
 * what refuses an illegal move. This exists so the *interface* can only ever
 * offer edges the function would accept, and so the admin controls are
 * generated rather than hand-written — a hand-written button is a button that
 * outlives the rule it was written for.
 *
 * `tests/rls/orders.test.ts` walks all 49 pairs against the live function
 * using this list, so a divergence between the two fails a test rather than
 * shipping a control that errors when pressed.
 */

export type Actor = 'owner' | 'admin'

export type Transition = {
  from: OrderStatus
  to: OrderStatus
  /** Who may walk this edge, besides the trusted server context. */
  by: Actor
  /** The analyst's button, where they have one. Absent = not theirs to press. */
  label?: string
  /** Said in the confirmation, in terms of what it costs whoever is waiting. */
  consequence?: string
  /** Rejection carries a reason the customer reads verbatim. */
  needsReason?: boolean
}

export const TRANSITIONS: readonly Transition[] = [
  // Walked only inside submit_order(); a direct owner call is refused
  // (review-gate hardening, 20260902200000). Still the owner's edge in the
  // sense that the owner is the one who submits.
  { from: 'draft', to: 'sample_under_review', by: 'owner' },
  {
    from: 'sample_under_review',
    to: 'analysis_in_progress',
    by: 'admin',
    label: 'Approve this sample',
    consequence: 'Starts the turnaround and fixes the delivery date.',
  },
  {
    from: 'sample_under_review',
    to: 'needs_reupload',
    by: 'admin',
    label: 'Ask for another try',
    consequence: 'The customer sees your reason and has 14 days to send a replacement.',
    needsReason: true,
  },
  { from: 'needs_reupload', to: 'sample_under_review', by: 'owner' },
  {
    from: 'needs_reupload',
    to: 'parked',
    by: 'admin',
    label: 'Park this order',
    consequence: 'Stops the wait. The customer is told how to reach you.',
  },
  {
    from: 'analysis_in_progress',
    to: 'report_generating',
    by: 'admin',
    label: 'Start the report',
    consequence: 'Moves it into production, where the report can be attached.',
  },
  {
    from: 'report_generating',
    to: 'completed',
    by: 'admin',
    // Deliberately unlabelled: completing happens by attaching the report,
    // inside attach_report(), so an order can never be completed with nothing
    // to download. A button here would be a way to break that.
  },
]

export function isLegalTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to)
}

/** The buttons to render on an order in this state — never any others. */
export function adminActionsFor(status: OrderStatus): Transition[] {
  return TRANSITIONS.filter((t) => t.from === status && t.by === 'admin' && t.label)
}
