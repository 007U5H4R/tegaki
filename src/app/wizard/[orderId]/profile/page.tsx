import { notFound } from 'next/navigation'
import { Stage1Form } from '@/components/wizard/stage1-form'
import { createClient } from '@/lib/supabase/server'

export default async function ProfileStage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  // The layout has already established ownership and draft status; this reads
  // the saved values so a resumed wizard comes back filled in.
  const { data: order } = await supabase
    .from('orders')
    .select(
      'full_name, age, gender, city, country, email, phone, whatsapp_preferred, subject_is_self, subject_name, subject_age, consent_given_at',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (!order) notFound()

  return (
    <Stage1Form
      orderId={orderId}
      defaults={{
        fullName: order.full_name,
        age: order.age,
        gender: order.gender,
        city: order.city,
        country: order.country,
        email: order.email,
        phone: order.phone,
        whatsappPreferred: order.whatsapp_preferred,
        subjectIsSelf: order.subject_is_self,
        subjectName: order.subject_name,
        subjectAge: order.subject_age,
        consentGivenAt: order.consent_given_at,
      }}
    />
  )
}
