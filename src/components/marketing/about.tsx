import Image from 'next/image'
import { Reveal } from './reveal'

/**
 * About the analyst.
 *
 * A real photograph, supplied by Tushar, pinned to the paper like a snapshot.
 * Never a generated face: a service asking people to send their handwriting
 * and trust a stranger's reading of it cannot open by inventing the stranger.
 *
 * No credential chips. The plan permits them only for claims Tushar confirms
 * in writing, and he has confirmed none — so there are none, rather than
 * plausible-sounding ones nobody can check.
 *
 * The portrait is warmed in CSS rather than in the file: its blue backdrop
 * is the one saturated hue on the site that is not the wall's, and a warm
 * pass settles it into the page. Undoing this is deleting one class.
 */
export function About() {
  return (
    <section className="mx-auto w-full max-w-[84rem] px-5 py-20 sm:px-8 sm:py-24 lg:px-[4vw]">
      <Reveal soft className="border-inkl-900/15 grid items-start gap-12 border-t pt-14 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-20 lg:pt-16">
        {/* the snapshot */}
        <figure className="relative mx-auto w-56 -rotate-[2.5deg] lg:mx-0 lg:w-full">
          <div className="border-paper-100 relative border bg-[#faf3e4] p-3 pb-10 shadow-[0_1px_0_rgba(60,20,10,0.25)]">
            <span
              aria-hidden
              className="bg-paper-100/85 absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-3deg]"
            />
            <div className="relative overflow-hidden">
              <Image
                src="/tushar.jpg"
                alt="Tushar Pathak"
                width={397}
                height={397}
                sizes="(min-width: 1024px) 18rem, 14rem"
                className="h-auto w-full [filter:grayscale(0.4)_sepia(0.45)_saturate(1.3)_contrast(1.02)]"
              />
              <span aria-hidden className="bg-terra-600/20 absolute inset-0 mix-blend-multiply" />
            </div>
            <figcaption className="sr-only">Tushar Pathak</figcaption>
          </div>
        </figure>

        <div className="max-w-[58ch]">
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-bold tracking-[-0.015em] text-balance">
            Read by one person.
          </h2>
          <p className="mt-3 text-[1rem] font-semibold">Tushar Pathak, the analyst</p>

          <p className="mt-7 text-[1.05rem] leading-relaxed opacity-90">
            Every report on this site is read and written by one person. Your sample is not fed
            through a scoring tool and sent on unseen — it is looked at, thought about, and put into
            words by hand.
          </p>
          <p className="mt-4 text-[1.05rem] leading-relaxed opacity-90">
            Tegaki is a pilot, and small on purpose. That is why the turnaround is measured in days
            rather than minutes, why there is a limit on how many samples are in the queue at once,
            and why nothing reaches you until it has been read through in full.
          </p>
          <p className="font-hand text-pencil-600 mt-8 -rotate-2 text-[1.6rem] leading-none font-medium" aria-hidden>
            — Tushar Pathak
          </p>
        </div>
      </Reveal>
    </section>
  )
}
