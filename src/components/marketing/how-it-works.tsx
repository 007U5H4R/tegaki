import { MicroLabel } from '@/components/ui/card'
import { Reveal } from './reveal'

/**
 * How it works — Design.md §3.2-2.
 *
 * Three steps on the dashed rail that runs through this product: the wizard
 * stepper, the status rail and this share one visual language, so a customer
 * meets the same idea of "progress" three times rather than three ideas of it.
 *
 * The turnaround note under step three is the honest bit. The clock starts at
 * sample approval, not at payment, and saying so before somebody pays is what
 * makes it a promise rather than an excuse.
 */

const STEPS = [
  {
    n: '01',
    title: 'Write & photograph',
    body: 'Two pages, unlined paper, three signatures — our guide walks you through it.',
  },
  {
    n: '02',
    title: 'Choose your depth',
    body: 'Express, Core or Comprehensive — ₹999 to ₹2,999.',
  },
  {
    n: '03',
    title: 'Receive your report',
    body: 'A considered PDF in your dashboard within 3–7 days of sample approval.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <MicroLabel>How it works</MicroLabel>
        <h2 className="text-washi-50 mt-3 font-serif text-4xl">Three steps, and a wait.</h2>
      </Reveal>

      <ol className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step, i) => (
          <Reveal as="li" key={step.n} delay={i * 50} className="relative">
            {/* The connector reaches toward the next step and stops at the
                last one, rather than trailing off into nothing. */}
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden
                className="border-ink-700 absolute top-6 left-12 hidden w-[calc(100%-2rem)] border-t border-dashed sm:block"
              />
            ) : null}

            <p className="text-shu-500 font-serif text-4xl">{step.n}</p>
            <h3 className="text-washi-50 mt-4 font-serif text-2xl">{step.title}</h3>
            <p className="text-washi-300 mt-2 max-w-[38ch]">{step.body}</p>

            {i === STEPS.length - 1 ? (
              <p className="text-ink-500 mt-4 font-mono text-xs">
                The clock starts when your sample is approved.
              </p>
            ) : null}
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
