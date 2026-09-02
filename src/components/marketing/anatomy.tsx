import Image from 'next/image'
import { MicroLabel } from '@/components/ui/card'
import { SPECIMENS } from '@/content/anatomy'
import { Reveal } from './reveal'

/**
 * What a reading actually looks like — Design.md §3.2-4.
 *
 * The paper is the figure here, so each crop sits on its own washi surface
 * rather than in a dark card: a photograph of cream paper judged against a
 * near-black ground would misrepresent its own contrast.
 *
 * Each row separates the observation from the reading, in that order. The
 * mark on the page is evidence; what it suggests is interpretation. Letting
 * the two blur is precisely how this subject earns its bad reputation.
 */
export function Anatomy() {
  return (
    <section id="samples" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <MicroLabel>What we look at</MicroLabel>
        <h2 className="text-washi-50 mt-3 font-serif text-4xl">
          Three things on a page, and what they suggest.
        </h2>
        <p className="text-washi-300 mt-3 max-w-[52ch]">
          Your report names what is visible in your writing before it offers any reading of it, so
          you can disagree with the second part while still trusting the first.
        </p>
      </Reveal>

      <div className="mt-14 flex flex-col gap-10">
        {SPECIMENS.map((specimen, i) => (
          <Reveal
            key={specimen.id}
            delay={i * 60}
            className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10"
          >
            <div className="bg-washi-50 overflow-hidden rounded-2xl p-2">
              <Image
                src={specimen.src}
                alt={specimen.alt}
                width={900}
                height={450}
                sizes="(min-width: 640px) 45vw, 92vw"
                className="h-auto w-full rounded-lg"
              />
            </div>

            <div>
              <MicroLabel>{specimen.trait}</MicroLabel>
              <p className="text-washi-50 mt-3 text-lg">{specimen.observation}</p>
              <p className="text-washi-300 mt-3 max-w-[46ch]">{specimen.reading}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
