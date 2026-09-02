/**
 * The three specimen rows — Design.md §3.2-4.
 *
 * The crops are cut from Tegaki's own hero photograph, which is generated
 * imagery of handwriting made for this project. **No real client scan
 * appears on this page, anonymised or otherwise** — the C3 plan is explicit
 * about that, and a crop small enough to feel anonymous is still somebody's
 * hand.
 *
 * Each sentence names what is visible and then what it *suggests*. That
 * order matters: the observation is the evidence, the reading is an
 * interpretation, and the copy should not let them blur.
 */

export type Specimen = {
  id: string
  src: string
  alt: string
  trait: string
  observation: string
  reading: string
}

export const SPECIMENS: readonly Specimen[] = [
  {
    id: 'slant',
    src: '/specimens/slant.jpg',
    alt: 'A line of cursive handwriting leaning consistently to the right on cream paper',
    trait: 'Slant',
    observation: 'Letters lean right, consistently, across the whole line.',
    reading:
      'A pronounced rightward slant suggests expressive engagement with other people — a tendency to move toward, rather than hold back from.',
  },
  {
    id: 'tbar',
    src: '/specimens/tbar.jpg',
    alt: 'Close view of crossed t letters in cursive, the crossbars sitting high on the stems',
    trait: 'The t-bar',
    observation: 'The crossbars sit high on the stem and travel well past it.',
    reading:
      'High, long t-bars often indicate goals set above present reach, and enough drive to keep reaching for them.',
  },
  {
    id: 'loops',
    src: '/specimens/loops.jpg',
    alt: 'Close view of descending loops in cursive handwriting, full and returning to the baseline',
    trait: 'Lower loops',
    observation: 'Descenders are full and return cleanly to the baseline.',
    reading:
      'Generous, closed lower loops suggest emotional energy that is available to be spent rather than held in reserve.',
  },
] as const
