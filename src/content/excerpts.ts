/**
 * Landing-page excerpts — C3.
 *
 * Three fictional composite subjects, one per tier. They are composites in
 * the strict sense: nothing here comes from a real client's report, and the
 * label saying so appears **on the card**, not in a footnote somebody has to
 * go looking for. Solution-PRD §2 rules out testimonials until real ones
 * exist, and a "sample" that quietly used a real customer's assessment would
 * be a worse version of the same dishonesty.
 *
 * Every sentence is written as an indication. `scripts/check-claims.mjs`
 * greps this file, so the voice is enforced rather than remembered.
 */

import type { Tier } from '@/lib/tiers'

export type Excerpt = {
  tier: Tier
  /** Fictional, and labelled as such wherever this is rendered. */
  subject: string
  context: string
  heading: string
  body: string
}

export const FICTIONAL_LABEL = 'Illustrative sample — fictional subject'

export const EXCERPTS: readonly Excerpt[] = [
  {
    tier: 'express',
    subject: 'Meera, 29',
    context: 'Product designer · Pune',
    heading: 'On how she starts things',
    body: 'The upward drift of your baseline, held across two pages without tiring, suggests someone who begins from optimism rather than caution. Your capitals are noticeably larger than the letters that follow them, which often indicates a person who commits to an idea early and works out the detail on the way. The steadiness of your pressure suggests that this is stamina rather than enthusiasm — you appear to stay with things after the interesting part has passed.',
  },
  {
    tier: 'core',
    subject: 'Rahul, 41',
    context: 'Operations lead · Bengaluru',
    heading: 'On the gap between what he decides and what he says',
    body: 'Your writing tightens noticeably in the second half of each page — spacing narrows, and the slant becomes more upright. This pattern often suggests someone who arrives at a position quickly and then spends effort making it acceptable to other people before saying it aloud. Your t-bars sit high and travel far, which tends to indicate ambition held at a distance from daily conversation. Taken together these suggest a person whose considered view is usually formed well before it is offered, and the development opportunity here may be less about deciding faster and more about letting others see the deciding.',
  },
  {
    tier: 'comprehensive',
    subject: 'Anjali, 34',
    context: 'Paediatric registrar · Kochi',
    heading: 'On how attention is rationed',
    body: 'The lower loops in your writing are full and returned cleanly to the baseline, which often suggests emotional energy that is available rather than withheld. Against that, your margins narrow sharply on the right, a pattern that tends to indicate reluctance to leave a page — or a day — unfinished. Your signature is markedly smaller than your everyday writing, and that difference is usually worth reading as a preference for being effective in private over being visible in public. Read together with the trait dashboard, these suggest someone whose limits are set by what they will not leave undone rather than by what they cannot do.',
  },
] as const
