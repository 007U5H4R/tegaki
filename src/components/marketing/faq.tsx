import { MicroLabel } from '@/components/ui/card'
import { FAQ } from '@/content/faq'
import { Reveal } from './reveal'

/**
 * The FAQ — Design.md §3.2-8.
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
    <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <MicroLabel>Questions</MicroLabel>
        <h2 className="text-washi-50 mt-3 font-serif text-4xl">Before you send anything.</h2>
      </Reveal>

      <div className="mt-12 max-w-[68ch]">
        {FAQ.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i, 4) * 40}>
            <details className="border-ink-700 group border-b">
              <summary className="text-washi-50 focus-visible:outline-shu-500 flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {item.q}
                <Chevron />
              </summary>
              <p className="text-washi-300 pb-6 leading-relaxed">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="text-washi-300 duration-press size-4 shrink-0 transition-transform ease-out group-open:rotate-180"
      aria-hidden
      focusable="false"
    >
      <path
        d="M4 6 8 10 12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
