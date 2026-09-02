'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { collectErrors, stage1Schema, type Stage1Errors } from './wizard-schema'
import { wizardPath } from './wizard'

export type Stage1State = {
  errors?: Stage1Errors
  /** For failures that belong to no single field. */
  formError?: string
}

/**
 * Save wizard stage 1.
 *
 * Validated three times over, and deliberately so. The browser checks for
 * immediate feedback, this action re-checks because a client-side check
 * protects nobody, and the database refuses to let a non-draft order carry a
 * missing consent at all. Only the last of those is a guarantee.
 */
export async function saveStage1(
  orderId: string,
  _prev: Stage1State,
  formData: FormData,
): Promise<Stage1State> {
  const subjectIsSelf = formData.get('subjectIsSelf') === 'self'

  const parsed = stage1Schema.safeParse({
    fullName: formData.get('fullName'),
    age: formData.get('age'),
    gender: formData.get('gender') ?? '',
    city: formData.get('city'),
    country: formData.get('country'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    whatsappPreferred: formData.get('whatsappPreferred') === 'on',
    subjectIsSelf,
    subjectName: formData.get('subjectName') ?? '',
    subjectAge: formData.get('subjectAge') || '',
    consent: formData.get('consent') === 'on',
  })

  if (!parsed.success) {
    return { errors: collectErrors(parsed.error) }
  }

  const v = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.rpc('save_order_profile', {
    p_order_id: orderId,
    p_full_name: v.fullName,
    p_age: v.age,
    p_gender: v.gender || null,
    p_city: v.city,
    p_country: v.country,
    p_email: v.email,
    p_phone: v.phone,
    p_whatsapp: v.whatsappPreferred,
    p_subject_is_self: v.subjectIsSelf,
    p_subject_name: v.subjectName || null,
    p_subject_age: v.subjectAge === '' || v.subjectAge === undefined ? null : Number(v.subjectAge),
    p_consent: v.consent,
  })

  if (error) {
    return { formError: `We could not save that: ${error.message}` }
  }

  revalidatePath('/dashboard')
  redirect(wizardPath(orderId, 'upload'))
}
