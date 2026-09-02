import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { SampleUploader } from '@/components/upload/sample-uploader'
import { Button } from '@/components/ui/button'
import { clampSegment, wizardPath } from '@/lib/orders/wizard'
import { createClient } from '@/lib/supabase/server'

export default async function UploadStage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, wizard_stage, guardrails_acked')
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  // Someone who types this URL before finishing stage 1 is sent back rather
  // than shown a stage with nothing to work from.
  const allowed = clampSegment('upload', order.wizard_stage)
  if (allowed !== 'upload') redirect(wizardPath(orderId, allowed))

  const { data: files } = await supabase
    .from('order_files')
    .select('id, file_name, size_bytes')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const hasFiles = (files?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-washi-50 font-serif text-3xl">Your handwriting sample</h1>
        <p className="text-washi-300 mt-3">
          Photograph each page flat and in good light. Only you and your analyst will ever see
          these, and they are deleted 90 days after your report is delivered.
        </p>
      </div>

      <SampleUploader
        orderId={order.id}
        buyerId={order.buyer_id}
        initialGuardrails={(order.guardrails_acked as Record<string, boolean>) ?? {}}
        initialFiles={files ?? []}
      />

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={wizardPath(orderId, 'profile')}>Back</Link>
        </Button>

        {hasFiles ? (
          <Button asChild>
            <Link href={wizardPath(orderId, 'tier')}>Choose your depth</Link>
          </Button>
        ) : (
          <p className="text-washi-300 text-sm">Upload at least one page to continue.</p>
        )}
      </div>
    </div>
  )
}
