'use client'

import { useRouter } from 'next/navigation'
import { Toast } from '@/components/ui/toast'

/**
 * The confirmation a customer sees after submitting.
 *
 * The flag arrives as a search param because the toast has to survive a
 * navigation. Clearing it once shown means a refresh, or a link shared with
 * the param still attached, does not congratulate somebody twice.
 */
export function SubmittedToast() {
  const router = useRouter()

  return (
    <Toast
      message="Sample received — we’ll review it shortly and email you either way."
      onDismiss={() => router.replace('/dashboard')}
    />
  )
}
