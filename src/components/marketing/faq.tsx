import { FAQ } from '@/content/faq'
import { CONTACT_EMAIL } from '@/lib/copy'
import { Reveal } from './reveal'

/**
 * The FAQ, on the paper.
 *
 * Native `<details>`/`<summary>`: keyboard operation, `aria-expanded`
 * semantics and find-in-page all come from the browser, and none of them can
 * be got subtly wrong. A hand-built accordion here would be three days of
 * work to arrive back where this starts.
 *
 * The questions people actually worry about — is this real, who sees my
 * handwriting, what if you cannot read it — are answered plainly and early
 * rather than softened. The second question says outright that this is not
 * a science, which is not a comfortable sentence to put on a sales page and
 * is the reason to trust the rest of it.
 */
export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-[84rem] scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-[4vw]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <Reveal soft className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-bold tracking-[-0.015em] text-balance">
            Before you send anything.
          </h2>
          <p className="font-hand text-pencil-600 mt-6 -rotate-2 text-[1.45rem] leading-[1.1] font-medium" aria-hidden>
            the awkward ones
            <br />
            are answered first.
          </p>
          <p className="mt-10 max-w-[30ch] text-[0.98rem] leading-relaxed opacity-85">
            Something not covered? Write to Tushar Pathak directly at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-fine break-all font-medium opacity-100">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Reveal>

        <div className="border-inkl-900/15 border-t">
          {FAQ.map((item, i) => (
            <Reveal soft key={item.q} delay={Math.min(i, 5) * 40}>
              <details className="faq-item border-inkl-900/15 group border-b">
                <summary className="font-display flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.15rem] leading-snug font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus />
                </summary>
                <p className="max-w-[62ch] pb-7 text-[1.02rem] leading-[1.7] opacity-90">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Two pencil strokes; the vertical one swings away when the answer opens. */
function Plus() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="text-pencil-500 mt-0.5 size-5 shrink-0"
      aria-hidden
      focusable="false"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M 3 10.2 C 8 9.6 13 10.4 17 9.8" />
      <path
        d="M 10.2 3 C 9.6 8 10.4 13 9.8 17"
        className="faq-plus-v origin-center transition-transform duration-300 ease-out group-open:rotate-90 group-open:opacity-0"
      />
    </svg>
  )
}
