import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { SampleUploader } from '@/components/upload/sample-uploader'
import { MicroLabel } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Upload a sample — Tegaki',
  robots: { index: false, follow: false },
}

/**
 * TEMPORARY — the T04 demo surface.
 *
 * T05 mounts SampleUploader inside the real wizard at /wizard/[orderId]/upload
 * and deletes this route. It exists so the riskiest slice in the build can be
 * exercised end to end before the wizard shell exists, rather than the two
 * being debugged together.
 */
export default async function UploadDemoPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // RLS means a stranger's order id simply returns nothing, so a wrong guess
  // is indistinguishable from a non-existent order — which is the point.
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, status, guardrails_acked')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  const { data: files } = await supabase
    .from('order_files')
    .select('id, file_name, size_bytes')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const uploadable = order.status === 'draft' || order.status === 'needs_reupload'

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <MicroLabel>Tegaki · 手書き · sample</MicroLabel>
      <h1 className="text-washi-50 mt-4 font-serif text-4xl">Your handwriting sample</h1>
      <p className="text-washi-300 mt-3">
        Photograph each page flat, in good light. Only you and your analyst will ever see these.
      </p>

      <div className="mt-10">
        {uploadable ? (
          <SampleUploader
            orderId={order.id}
            buyerId={order.buyer_id}
            initialGuardrails={(order.guardrails_acked as Record<string, boolean>) ?? {}}
            initialFiles={files ?? []}
          />
        ) : (
          <p className="border-ink-700 bg-ink-900 text-washi-300 rounded-2xl border p-6">
            This order is no longer accepting uploads. Your analyst has it.
          </p>
        )}
      </div>
    </main>
  )
}
