import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Seal } from '@/components/brand/seal'
import { OrderCard } from '@/components/orders/order-card'
import { SubmittedToast } from '@/components/orders/submitted-toast'
import { Button } from '@/components/ui/button'
import { MicroLabel } from '@/components/ui/card'
import { EmptyState, SkeletonList } from '@/components/ui/states'
import { signOut } from '@/lib/auth/actions'
import { createDraftOrder } from '@/lib/orders/actions'
import { getMyOrders } from '@/lib/orders/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Your assessments — Tegaki',
  robots: { index: false },
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const { submitted } = await searchParams
  const supabase = await createClient()

  // getUser(), not getSession(): it verifies the token with the auth server
  // rather than trusting a cookie the browser handed us.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <MicroLabel>Tegaki · 手書き{profile?.role === 'admin' ? ' · admin' : ''}</MicroLabel>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-washi-50 font-serif text-4xl">Your assessments</h1>
          <p className="text-washi-300 mt-2">
            Signed in as {profile?.full_name ? `${profile.full_name} · ` : ''}
            {profile?.email ?? user.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Without this the queue is reachable only by typing the URL. The
              guard is what makes it safe; this is what makes it usable. */}
          {profile?.role === 'admin' ? (
            <Button asChild variant="ghost">
              <Link href="/admin">Review queue</Link>
            </Button>
          ) : null}

          <form action={createDraftOrder}>
            <Button type="submit">New request</Button>
          </form>
        </div>
      </div>

      {/* Streamed, so the page shell and the New request button are usable
          before the list resolves — the skeleton is what people see while it
          does, not a blank screen. */}
      <div className="mt-10">
        <Suspense fallback={<SkeletonList count={2} />}>
          <OrderList />
        </Suspense>
      </div>

      <form action={signOut} className="mt-12">
        <Button variant="ghost" size="sm" type="submit">
          Sign out
        </Button>
      </form>

      {submitted ? <SubmittedToast /> : null}
    </main>
  )
}

async function OrderList() {
  const orders = await getMyOrders()

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Seal size={72} title={null} />}
        title="Your first assessment begins with a handwriting sample."
        body={
          <>
            Two pages on unlined paper and three signatures. We will walk you through exactly what
            to write, and your sample stays visible only to you and your analyst.
          </>
        }
        action={
          <form action={createDraftOrder}>
            <Button type="submit">Begin your assessment</Button>
          </form>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          action={
            // Without this the wizard's resume is real but unreachable:
            // someone who closes the tab has no way back to their draft.
            order.status === 'draft' ? (
              <Button asChild size="sm">
                <Link href={`/wizard/${order.id}`}>Continue</Link>
              </Button>
            ) : null
          }
        />
      ))}
    </div>
  )
}
