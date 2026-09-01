import type { Metadata } from 'next'
import { BrandStoryLine, Lockup } from '@/components/brand/lockup'
import { Seal } from '@/components/brand/seal'
import { Button } from '@/components/ui/button'
import { Card, DashedRule, MicroLabel } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { Stepper } from '@/components/ui/stepper'
import { EmptyState, SkeletonList } from '@/components/ui/states'
import { ORDER_STATUSES } from '@/lib/orders/status'
import { Buttons, ErrorSpecimen, Fields, Upload } from './interactive'

export const metadata: Metadata = {
  title: 'Styleguide — Tegaki',
  robots: { index: false, follow: false },
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <MicroLabel>Tegaki · design system · T02</MicroLabel>
      <h1 className="text-washi-50 mt-4 text-4xl">Styleguide</h1>
      <p className="text-washi-300 mt-3 max-w-[680px]">
        Every primitive in every state. This page is the regression surface for the design system —
        if a component is not here, later tickets have no sanctioned way to use it.
      </p>

      <Section title="Brand">
        <div className="flex flex-wrap items-end gap-10">
          {[16, 24, 48, 96].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Seal size={size} className="text-shu-500" />
              <span className="text-ink-500 font-mono text-xs">{size}px</span>
            </div>
          ))}
        </div>
        <p className="text-washi-300 mt-6 max-w-[560px] text-sm">
          The rim thickens below 20px so the silhouette still reads as a seal at favicon size. The
          glyph is a real outline, not live text, so the mark never reflows while a font loads.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <Lockup />
          <BrandStoryLine />
        </div>
      </Section>

      <Section title="Colour">
        <Swatches
          label="Ink — ground"
          items={[
            ['ink-950', 'bg-ink-950'],
            ['ink-900', 'bg-ink-900'],
            ['ink-800', 'bg-ink-800'],
            ['ink-700', 'bg-ink-700'],
            ['ink-500', 'bg-ink-500'],
          ]}
        />
        <Swatches
          label="Washi — figure"
          items={[
            ['washi-50', 'bg-washi-50'],
            ['washi-300', 'bg-washi-300'],
          ]}
        />
        <Swatches
          label="Shu — the only saturated hue"
          items={[
            ['shu-500', 'bg-shu-500'],
            ['shu-600', 'bg-shu-600'],
            ['shu-700', 'bg-shu-700'],
            ['shu-900', 'bg-shu-900'],
          ]}
        />
        <Swatches
          label="State — never used without an icon and text"
          items={[
            ['ok-500', 'bg-ok-500'],
            ['warn-500', 'bg-warn-500'],
            ['err-500', 'bg-err-500'],
          ]}
        />
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-4">
          <p className="text-washi-50 font-serif text-5xl">Your handwriting holds a story.</p>
          <p className="text-washi-50 font-serif text-3xl">Instrument Serif · headings</p>
          <p className="text-washi-300 text-lg">
            Manrope · body copy. A personal, growth-oriented assessment of what your writing
            suggests about how you think and work.
          </p>
          <p className="text-washi-300 font-mono text-xs tracking-[0.08em] uppercase">
            Geist Mono · micro-labels and order ids
          </p>
          <p className="font-jp text-washi-50 text-3xl" lang="ja">
            手書き
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <Buttons />
      </Section>

      <Section title="Form controls">
        <Fields />
      </Section>

      <Section title="Status chips">
        <p className="text-washi-300 mb-4 text-sm">
          One per state in the order machine — no more, no less.
        </p>
        <div className="flex flex-wrap gap-3">
          {ORDER_STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Stepper">
        <div className="flex flex-col gap-10">
          {[0, 1, 3].map((current) => (
            <Stepper
              key={current}
              steps={['Profile', 'Sample', 'Tier', 'Confirm']}
              current={current}
            />
          ))}
        </div>
      </Section>

      <Section title="Upload">
        <Upload />
      </Section>

      <Section title="Screen states">
        <p className="text-washi-300 mb-6 text-sm">
          Loading, empty, error and working — every data view ships all four.
        </p>
        <div className="flex flex-col gap-10">
          <div>
            <MicroLabel tone="muted">Loading</MicroLabel>
            <div className="mt-3">
              <SkeletonList count={2} />
            </div>
          </div>

          <div>
            <MicroLabel tone="muted">Empty</MicroLabel>
            <Card className="mt-3 p-0">
              <EmptyState
                icon={<Seal size={64} title={null} />}
                title="Your first assessment begins with a handwriting sample."
                body="Two pages on unlined paper and three signatures. We will walk you through it."
                action={<Button>Begin your assessment</Button>}
              />
            </Card>
          </div>

          <div>
            <MicroLabel tone="muted">Error</MicroLabel>
            <div className="mt-3">
              <ErrorSpecimen />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Surfaces">
        <Card>
          <p className="text-washi-50">
            A card: ink-900 on the ground, hairline border, 16px radius.
          </p>
          <p className="text-washi-300 mt-2 text-sm">
            Elevation is luminance, not shadow — a drop shadow on near-black is invisible.
          </p>
        </Card>
        <DashedRule className="my-8" />
        <p className="text-washi-300 text-sm">
          Above: the genkō yōshi dashed rule that separates landing sections.
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="text-washi-50 font-serif text-2xl">{title}</h2>
      <DashedRule className="mt-3 mb-8" />
      {children}
    </section>
  )
}

function Swatches({
  label,
  items,
}: {
  label: string
  items: readonly (readonly [string, string])[]
}) {
  return (
    <div className="mb-8">
      <MicroLabel tone="muted">{label}</MicroLabel>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(([name, cls]) => (
          <div key={name} className="border-ink-700 rounded-2xl border p-3">
            <div className={`h-12 rounded-lg ${cls}`} />
            <p className="text-washi-300 mt-2 font-mono text-xs">{name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
