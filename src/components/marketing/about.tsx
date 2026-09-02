import Image from 'next/image'
import { MicroLabel } from '@/components/ui/card'
import { Reveal } from './reveal'

/**
 * About the analyst — Design.md §3.2-7.
 *
 * A real photograph, supplied by Tushar. Never a generated face: a service
 * asking people to send their handwriting and trust a stranger's reading of
 * it cannot open by inventing the stranger.
 *
 * No credential chips. The plan permits them only for claims Tushar confirms
 * in writing, and he has confirmed none — so there are none, rather than
 * plausible-sounding ones nobody can check.
 *
 * The portrait is tinted in CSS rather than in the file: its blue backdrop
 * is the only saturated hue on the site that is not vermilion, and a warm
 * pass settles it into the page. The original file is untouched, so undoing
 * this is deleting one class.
 */
export function About() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="grid items-start gap-10 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-12">
        <div className="border-ink-700 relative w-40 overflow-hidden rounded-2xl border sm:w-full">
          <Image
            src="/tushar.jpg"
            alt="Tushar Pathak"
            width={397}
            height={397}
            sizes="(min-width: 640px) 14rem, 10rem"
            className="h-auto w-full [filter:grayscale(0.35)_sepia(0.42)_saturate(1.35)_contrast(1.02)]"
          />
          <span aria-hidden className="bg-shu-900/12 absolute inset-0 mix-blend-multiply" />
        </div>

        <div>
          <MicroLabel>Who reads it</MicroLabel>
          <h2 className="text-washi-50 mt-3 font-serif text-4xl">Tushar Pathak</h2>

          <p className="text-washi-300 mt-5 max-w-[58ch]">
            Every report on this site is read and written by one person. Your sample is not fed
            through a scoring tool and sent on unseen — it is looked at, thought about, and put into
            words by hand.
          </p>
          <p className="text-washi-300 mt-4 max-w-[58ch]">
            Tegaki is a pilot, and small on purpose. That is why the turnaround is measured in days
            rather than minutes, why there is a limit on how many samples are in the queue at once,
            and why nothing reaches you until it has been read through in full.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
