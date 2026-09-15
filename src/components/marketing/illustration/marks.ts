export type MarkId = 'slant' | 'spacing' | 'baseline'

/**
 * The analyst's three red-pencil notes and the explanation each opens.
 *
 * Graphology is an interpretive practice, not a measurement, and the copy
 * says so: "we notice", "may suggest", "can be associated with". Nothing
 * here is stated as a finding about a person — and this is reference
 * content on a sample page, not a reading of anyone's handwriting.
 */
export const NOTES: Record<MarkId, { title: string; notice: string; suggest: string }> = {
  slant: {
    title: 'Open, empathetic',
    notice: 'The letters lean consistently to the right, line after line.',
    suggest: 'Often associated with an outward, expressive way of engaging with people.',
  },
  spacing: {
    title: 'Balanced thinking',
    notice: 'The gaps between words stay fairly even across the page.',
    suggest: 'Can be associated with weighing several perspectives and staying open-minded.',
  },
  baseline: {
    title: 'Resilient',
    notice: 'Each line holds its level instead of drifting up or down.',
    suggest: 'May suggest steadiness, and a habit of getting back up.',
  },
}

/** Load order: the circle around "grateful" first, then the two margin notes. */
export const MARK_ORDER: MarkId[] = ['slant', 'spacing', 'baseline']
/** Milliseconds after the terracotta is on screen. */
export const MARK_AT: Record<MarkId, number> = { slant: 900, spacing: 1650, baseline: 2300 }
