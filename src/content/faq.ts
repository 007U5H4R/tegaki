/**
 * The FAQ — one source for the accordion and the FAQPage JSON-LD.
 *
 * Written to the PRD's indicative-claims guardrail. Graphology is offered
 * here as a structured, growth-oriented mirror, never as a diagnosis or a
 * prediction, and the second question says so outright rather than burying
 * it. A page that has to be asked twice before it admits what it is not is a
 * page that was hoping you would not ask.
 *
 * `scripts/check-claims.mjs` greps this file for absolutes, so the voice is
 * enforced rather than remembered.
 */

export type FaqItem = { q: string; a: string }

export const FAQ: readonly FaqItem[] = [
  {
    q: 'What exactly do I get?',
    a: 'A written assessment of what your handwriting suggests about how you think, work and relate to people — read by a person, not generated and sent unseen. Depending on the depth you choose it runs from one to six or more pages, and it arrives as a PDF in your dashboard.',
  },
  {
    q: 'Is this scientific?',
    a: 'No, and we would rather say so plainly. Graphology is not an established science and this is not a psychological or medical assessment. What it offers is a structured, consistent reading of your writing, framed as something to reflect on. Everything in your report is written as an indication, never as a fact about you.',
  },
  {
    q: 'Is this a diagnosis of any kind?',
    a: 'No. Nothing here identifies a condition, and nothing here should be used in place of advice from a doctor, therapist or counsellor. If a report ever reads like it is doing that, we have written it badly.',
  },
  {
    q: 'What should I write?',
    a: 'Something of your own — a few paragraphs about your week, a letter you will never send, what you are thinking about. Copied text, poems and quotations are not usable, because what is being read is how you write when you are composing rather than transcribing.',
  },
  {
    q: 'Does the paper matter?',
    a: 'Yes, more than most people expect. Use unlined, blank paper: ruled lines change how you place and slant your writing, which is a large part of what is being read. Two pages, in your ordinary pen, plus three signatures at the bottom.',
  },
  {
    q: 'How do I send the photos?',
    a: 'Photograph each page flat and in good daylight, with all four edges in frame, and upload them in the wizard. Phone photos are expected — you do not need a scanner. If a page comes out unreadable we will ask for another before any clock starts.',
  },
  {
    q: 'Who can see my handwriting?',
    a: 'You and your analyst, and nobody else. Samples live in private storage that is unreadable without a signed, short-lived link, and they are deleted 90 days after your report is delivered. We never publish, share or sell a sample.',
  },
  {
    q: 'How long does it take?',
    a: 'Three, five or seven days depending on the depth you choose — counted from the moment your sample is accepted rather than from when you pay. If we cannot read your photos, the wait has not started and you have lost nothing.',
  },
  {
    q: 'What if my sample cannot be used?',
    a: 'You will get a specific reason and fourteen days to send a replacement, and the original stays on file. If you would rather not continue, a sample we could not use means a full refund.',
  },
  {
    q: 'Can I order one for somebody else?',
    a: 'Yes, and we ask you to confirm you have their permission first. Somebody has not agreed to be written about simply by having written something, so that confirmation is recorded against the order.',
  },
] as const
