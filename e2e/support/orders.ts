import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Seed an order sitting in `sample_under_review` — exactly the state the
 * review queue receives one in.
 *
 * Written with the service role rather than by walking the wizard: the wizard
 * has its own end-to-end spec, and replaying it here would make every admin
 * test depend on the customer flow staying green.
 */
export async function seedSubmittedOrder(
  service: SupabaseClient,
  buyerId: string,
  options: { tier?: string; subject?: string } = {},
): Promise<string> {
  const { tier = 'core', subject } = options

  const { data, error } = await service
    .from('orders')
    .insert({
      buyer_id: buyerId,
      tier,
      wizard_stage: 4,
      full_name: subject ?? 'Asha Menon',
      age: 34,
      city: 'Kochi',
      country: 'India',
      email: 'asha@example.com',
      phone: '+91 98765 43210',
      guardrails_acked: {
        unlined: true,
        twoPages: true,
        signatures: true,
        spontaneous: true,
      },
    })
    .select('id')
    .single()
  if (error) throw new Error(`could not seed an order: ${error.message}`)

  const id = data!.id as string

  const { error: fileError } = await service.from('order_files').insert({
    order_id: id,
    uploader_id: buyerId,
    version: 1,
    bucket_path: `${buyerId}/${id}/v1/${crypto.randomUUID()}.jpg`,
    file_name: 'page-1.jpg',
    mime: 'image/jpeg',
    size_bytes: 210_000,
  })
  if (fileError) throw new Error(`could not seed a sample row: ${fileError.message}`)

  const { error: submitError } = await service.rpc('submit_order', { p_order_id: id })
  if (submitError) throw new Error(`could not submit the seeded order: ${submitError.message}`)

  return id
}
