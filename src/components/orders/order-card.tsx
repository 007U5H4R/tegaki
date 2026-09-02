import { Card } from '@/components/ui/card'
import { StatusChip } from '@/components/ui/status-chip'
import { PILOT_ORDER_NOTE } from '@/lib/copy'
import type { Order } from '@/lib/orders/queries'
import { TIER_DETAILS } from '@/lib/tiers'

/**
 * One order on the dashboard.
 *
 * Deliberately quiet for now: subject details arrive with the wizard (T05),
 * the progress rail and expected delivery date with T08, and the report
 * download with T09. Each ticket adds what it can actually populate, rather
 * than this card promising fields nothing fills.
 */
export function OrderCard({ order, action }: { order: Order; action?: React.ReactNode }) {
  const tier = order.tier ? TIER_DETAILS[order.tier] : null

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-washi-50 font-serif text-xl">
            {tier ? tier.name : 'New assessment'}
          </h3>
          <p className="text-ink-500 mt-1 font-mono text-xs">
            {/* Short id: enough for Tushar and a customer to refer to the same
                order over WhatsApp, without printing a full UUID at anyone. */}
            {order.id.slice(0, 8).toUpperCase()} · started{' '}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <StatusChip status={order.status} />
      </div>

      {order.status === 'draft' ? (
        <p className="text-washi-300 text-sm">
          You have not finished this request yet. Nothing has been submitted.
        </p>
      ) : (
        <p className="text-washi-300 text-sm">
          {tier ? `${tier.turnaroundDays} days from sample approval. ` : ''}
          {/* Repeated here and not only at checkout: weeks later, "did I pay
              for this?" is exactly the question this card has to answer. */}
          <span className="text-ink-500">{PILOT_ORDER_NOTE}</span>
        </p>
      )}

      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </Card>
  )
}
