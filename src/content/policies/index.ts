/**
 * The three policy documents.
 *
 * Written in the same voice as the rest of the product, because a customer
 * who has just read a page that talks to them plainly and then meets three
 * screens of borrowed legalese has learned something about which one was the
 * marketing.
 *
 * Every fact here is a position Solution-PRD already settled — the 90-day
 * deletion, the 14-day re-upload window, refund only when no usable sample
 * arrived, consent when the subject is not the buyer, and the pilot taking no
 * real payment. Nothing is invented to fill a heading, and where the honest
 * answer is "this is a pilot run by one person", it says that.
 */

export type PolicySection = { heading: string; body: readonly string[] }

export type Policy = {
  slug: 'privacy' | 'refunds' | 'terms'
  title: string
  standfirst: string
  updated: string
  sections: readonly PolicySection[]
}

/** One date for all three: they were written together and are revised together. */
const UPDATED = '2 September 2026'

export const POLICIES: readonly Policy[] = [
  {
    slug: 'privacy',
    title: 'Privacy',
    standfirst:
      'What we hold, how long we hold it, and who can see it. Your handwriting is the most personal thing you send us, and it is treated that way.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'The photographs of your handwriting that you upload, and what you tell us in the order form: your name, age, city and country, an email address and a phone number. Optionally a gender, which is used only so your report reads naturally and is never part of the reading itself.',
          'If the assessment is for somebody else, we also hold their first name and age, and the confirmation that you have their permission.',
          'We do not collect payment details. This pilot takes no real payment, so there is nothing of that kind to hold.',
        ],
      },
      {
        heading: 'Who can see your handwriting',
        body: [
          'You and your analyst. Nobody else.',
          'Samples are held in private storage that cannot be read without a signed link that expires within minutes. There is no public URL for your sample, and no setting that would create one. We do not publish samples, share them, sell them, or use them as examples on this site — the specimen images on the landing page are from our own photographs, not from anybody’s submission.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'Your handwriting samples are deleted 90 days after your report is delivered. That happens automatically; you do not have to ask.',
          'Your report stays in your dashboard so you can download it again, along with the order details it was based on.',
          'If you would like everything removed sooner, or removed entirely, write to us and we will do it. You do not have to give a reason.',
        ],
      },
      {
        heading: 'Where it is held',
        body: [
          'On servers in Mumbai, operated by Supabase, and on Vercel’s hosting. Both are third parties acting on our instructions; neither is given permission to use your data for anything else.',
          'Signing in uses Google. Google tells us your email address and the name on your account; we do not receive your password, and we cannot see anything else in your Google account.',
        ],
      },
      {
        heading: 'What we do not do',
        body: [
          'We do not send marketing email. We do not use tracking pixels or advertising cookies. We do not build a profile of you for any purpose other than writing the report you asked for.',
        ],
      },
      {
        heading: 'Asking us about your data',
        body: [
          'Write to the address on the contact page and you can ask what we hold, ask for a copy, ask us to correct it, or ask us to delete it. This is a pilot run by one person, so the reply comes from a person and usually within a few days.',
        ],
      },
    ],
  },

  {
    slug: 'refunds',
    title: 'Refunds',
    standfirst:
      'The short version: if we cannot read your handwriting, you do not pay for the reading.',
    updated: UPDATED,
    sections: [
      {
        heading: 'The pilot takes no payment',
        body: [
          'Tegaki is running as a pilot. Checkout displays prices so the service can be tested as it will eventually work, but no card details are asked for and no money is taken. That is stated on the checkout screen and on every order afterwards.',
          'The policy below is what will apply once payments are real, and it is written now so the terms are known in advance rather than announced later.',
        ],
      },
      {
        heading: 'If your sample cannot be used',
        body: [
          'You will be told exactly what was wrong with it and given fourteen days to send a replacement. The original stays on file.',
          'If you would rather not continue at that point, you get a full refund. A sample we could not read is not a service you received.',
        ],
      },
      {
        heading: 'If the window closes',
        body: [
          'An order with no replacement after fourteen days is parked, and the page tells you how to reach us. Parked is not the same as finished — write to us and we will reopen it.',
        ],
      },
      {
        heading: 'Once your report is written',
        body: [
          'A report is a piece of considered work made specifically for you, and it cannot be returned once it has been read. So a refund is not offered on the grounds of disagreeing with what it says.',
          'That said, if a report is late, incomplete, or plainly not about your sample, tell us. We would rather fix it than argue about it.',
        ],
      },
      {
        heading: 'How long refunds take',
        body: [
          'Once payments are real, a refund will be issued to the original payment method within seven working days of being agreed.',
        ],
      },
    ],
  },

  {
    slug: 'terms',
    title: 'Terms',
    standfirst:
      'What Tegaki is, what it is not, and what each of us is agreeing to. Written to be read.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What this service is',
        body: [
          'Tegaki reads a sample of your handwriting and writes an assessment of what it suggests about how you think, work and relate to people. It is offered as a structured, growth-oriented thing to reflect on.',
          'Graphology is not an established science. Nothing in your report is a fact about you, a diagnosis, or a prediction, and nothing in it should be used in place of advice from a doctor, therapist, counsellor or lawyer. Every reading is written as an indication, and you are free to disagree with it.',
          'Reports are not used for hiring, screening, or any decision about another person’s employment, and we will not write one for that purpose.',
        ],
      },
      {
        heading: 'What you are agreeing to',
        body: [
          'That the handwriting you send is yours, or that you have the permission of the person whose handwriting it is. When an assessment is for somebody else, we ask you to confirm this before the order can be submitted, and that confirmation is recorded against it.',
          'That you are at least 18, or have a parent or guardian’s agreement to place the order.',
          'That your sample is your own writing rather than copied text — a poem or a quotation cannot be read, because what is being looked at is how you write when you are composing.',
        ],
      },
      {
        heading: 'What we are agreeing to',
        body: [
          'That every report is read and written by a person before it reaches you, and that nothing is sent unseen.',
          'That your handwriting is kept private, deleted on the schedule in the privacy policy, and never published or shared.',
          'That the turnaround we quote is counted from the moment your sample is accepted, not from when you order — so a photograph we cannot read costs you nothing but the time to take another.',
        ],
      },
      {
        heading: 'Your report belongs to you',
        body: [
          'You may keep it, print it, and share it with whoever you like. We keep the right to the underlying method and the templates, but the words written about your handwriting are yours.',
        ],
      },
      {
        heading: 'Limits',
        body: [
          'This is a pilot run by one person. Availability is not guaranteed, orders may be paused when the queue is full, and the service may change or stop. If it stops while you are waiting on a report, you will be told and refunded.',
          'Nothing here limits any right you have under Indian consumer law.',
        ],
      },
      {
        heading: 'Questions',
        body: [
          'The contact page has an address that reaches a person. Ask before ordering if anything here matters to you.',
        ],
      },
    ],
  },
] as const

export function policyBySlug(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug)
}
