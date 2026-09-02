import type { Metadata } from 'next'
import { DashedRule, MicroLabel } from '@/components/ui/card'
import { CONTACT_EMAIL } from '@/lib/copy'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach the person who reads and writes every Tegaki report.',
}

/**
 * One address, and a person behind it.
 *
 * Solution-PRD §6.4 also names a WhatsApp deep-link, and there is none here:
 * it needs a phone number Tushar has not supplied, and the T13 plan is
 * explicit that a placeholder must fail rather than ship. A dead `wa.me`
 * link on the page somebody reaches *because* their order is stuck would be
 * the worst possible place for one.
 */
export default function ContactPage() {
  return (
    <article className="mx-auto w-full max-w-[60ch] px-4 pt-32 pb-24 sm:px-6">
      <MicroLabel>Tegaki</MicroLabel>
      <h1 className="text-washi-50 mt-3 font-serif text-[clamp(2.25rem,6vw,3.25rem)]">
        Talk to a person
      </h1>
      <p className="text-washi-300 mt-4 text-lg">
        Tegaki is a pilot run by one person, so this reaches him rather than a queue. Replies
        usually take a day or two.
      </p>

      <DashedRule className="my-10" />

      <h2 className="text-washi-50 font-serif text-2xl">Email</h2>
      <p className="mt-3">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-washi-50 font-mono text-lg underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
      </p>

      <h2 className="text-washi-50 mt-10 font-serif text-2xl">What to write about</h2>
      <ul className="text-washi-300 mt-4 flex flex-col gap-3">
        <li>
          <strong className="text-washi-50">A parked order.</strong> If the two-week window for
          sending a replacement sample closed, say so and it will be reopened. Nothing has been
          lost.
        </li>
        <li>
          <strong className="text-washi-50">Your data.</strong> Ask what is held, ask for a copy, or
          ask for it to be deleted. You do not have to give a reason.
        </li>
        <li>
          <strong className="text-washi-50">A report that reads wrong.</strong> If it is late,
          incomplete, or plainly not about your sample, it will be looked at again.
        </li>
        <li>
          <strong className="text-washi-50">Anything before you order.</strong> Better asked first
          than assumed.
        </li>
      </ul>
    </article>
  )
}
