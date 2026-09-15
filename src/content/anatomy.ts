/**
 * The three specimens — what a reading actually looks at.
 *
 * The specimens are drawn, not photographed: a line of handwriting set in
 * the site's own hand face with the trait exaggerated in CSS (slant as a
 * skew, spacing as word-spacing, pressure as weight). **No real client scan
 * appears on this page, anonymised or otherwise** — the C3 plan is explicit
 * about that, and a crop small enough to feel anonymous is still somebody's
 * hand.
 *
 * Each pair names what is visible and then what it *suggests*. That order
 * matters: the observation is the evidence, the reading is an
 * interpretation, and the copy should not let them blur.
 */

export type Specimen = {
  id: 'slant' | 'spacing' | 'pressure'
  /** The analyst's one-word note, in red pencil. */
  trait: string
  /** The two lines written on the scrap. */
  lines: readonly [string, string]
  observation: string
  reading: string
}

export const SPECIMENS: readonly Specimen[] = [
  {
    id: 'slant',
    trait: 'slant',
    lines: ['I said yes before', 'I had finished thinking.'],
    observation: 'The letters lean right, consistently, across the whole line.',
    reading:
      'A steady rightward slant is often associated with moving toward people and situations rather than holding back from them.',
  },
  {
    id: 'spacing',
    trait: 'spacing',
    lines: ['Give me a minute', 'and I will have an answer.'],
    observation: 'The gaps between words stay wide and even, line after line.',
    reading:
      'Generous, regular spacing can be associated with a considered rhythm — room left between one thought and the next.',
  },
  {
    id: 'pressure',
    trait: 'pressure',
    lines: ['Some days I write', 'harder than others.'],
    observation: 'The strokes are dark and firm; the pen pressed rather than skated.',
    reading:
      'Heavier pressure may suggest intensity and staying power — feelings that register deeply and are slow to fade.',
  },
] as const
