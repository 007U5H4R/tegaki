'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveTier, type TierState } from '@/lib/orders/tier-action'
import { cn } from '@/lib/cn'
import { formatPrice, TIER_LIST, type Tier, type TierDetail } from '@/lib/tiers'

/**
 * Wizard stage 3 — Design.md §3.3, in-wizard variant.
 *
 * Stacked in one column at every width. The wizard is a 640px reading
 * column, so the landing page's three-column hairline layout would only
 * cramp it — and a single column keeps visual order, DOM order and focus
 * order identical, which a CSS-reordered "Core first on mobile" would not.
 * Core is anchored by its chip and wash instead of by its position.
 *
 * These are native radios inside labels, so arrow-key navigation, roving
 * tabindex and `aria-checked` all come from the browser rather than from
 * JavaScript that has to remember to be correct.
 */
export function TierForm({ orderId, defaultTier }: { orderId: string; defaultTier: Tier | null }) {
  const [state, formAction, pending] = useActionState<TierState, FormData>(
    saveTier.bind(null, orderId),
    {},
  )

  // Pre-anchored on Core when nothing is chosen yet: it is the recommended
  // depth, and an empty radio group makes people choose before they have read
  // anything.
  const [selected, setSelected] = useState<Tier>(defaultTier ?? 'core')

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Choose the depth of your assessment</legend>

        {TIER_LIST.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            checked={selected === tier.id}
            onSelect={() => setSelected(tier.id)}
          />
        ))}
      </fieldset>

      <Compare />

      <p className="text-washi-300 text-sm">
        Sample not usable? Full refund. You also have 14 days to send a replacement page if we ask
        for one.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" loading={pending} className="w-full sm:w-auto">
          Review your order
        </Button>
      </div>
    </form>
  )
}

function TierCard({
  tier,
  checked,
  onSelect,
}: {
  tier: TierDetail
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col gap-4 rounded-2xl border p-6',
        'duration-press transition-[border-color,background-color] ease-out',
        tier.id === 'core' && 'order-first sm:order-none',
        checked ? 'border-shu-500 bg-shu-900/30' : 'border-ink-700 hover:border-ink-500',
        'has-[:focus-visible]:outline-shu-500 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
      )}
    >
      <input
        type="radio"
        name="tier"
        value={tier.id}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          {tier.popular ? (
            <span className="border-shu-500 text-shu-500 mb-2 inline-block rounded-full border px-3 py-1 font-mono text-xs tracking-[0.08em] uppercase">
              Most popular
            </span>
          ) : null}

          <h2 className="text-washi-50 font-serif text-2xl">{tier.name}</h2>

          <p className="text-washi-300 mt-1 font-mono text-xs tracking-[0.08em] uppercase">
            {tier.turnaroundDays}-day turnaround · {tier.pages}
          </p>
        </div>

        <p className="text-washi-50 font-serif text-4xl sm:text-5xl">
          {formatPrice(tier.priceInr)}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {tier.contents.map((item) => (
          <li key={item} className="text-washi-300 flex gap-3 text-sm">
            <Tick />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </label>
  )
}

/**
 * The three tiers side by side.
 *
 * A disclosure rather than a sheet: the report excerpts that would justify a
 * modal do not exist until C3, and the honest comparison — what each depth
 * actually includes — is already data we hold.
 */
function Compare() {
  return (
    <details className="border-ink-700 group rounded-2xl border">
      <summary
        className={cn(
          'text-washi-50 flex cursor-pointer list-none items-center justify-between gap-3 p-4',
          'focus-visible:outline-shu-500 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        )}
      >
        <span className="text-sm font-medium">Compare what&rsquo;s inside</span>
        <Chevron />
      </summary>

      <div className="border-ink-700 flex flex-col gap-6 border-t p-4">
        {TIER_LIST.map((tier) => (
          <div key={tier.id}>
            <p className="text-shu-500 font-mono text-xs tracking-[0.08em] uppercase">
              {tier.name} · {formatPrice(tier.priceInr)}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {tier.contents.map((item) => (
                <li key={item} className="text-washi-300 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="text-shu-500 mt-0.5 size-4 shrink-0"
      aria-hidden
      focusable="false"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
