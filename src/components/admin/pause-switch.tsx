'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { setPaused } from '@/lib/settings-actions'
import { cn } from '@/lib/cn'

/**
 * Closing the shop.
 *
 * The card turns warn-tinted when it is on, because the state that costs
 * money should not look the same as the state that does not. The copy says
 * exactly what stops and what does not — the question anybody asks on seeing
 * a pause switch is "does this abandon the people already waiting?", and the
 * answer is no.
 */
export function PauseSwitch({ paused }: { paused: boolean }) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setWorking(true)
    setError(null)
    const result = await setPaused(!paused)
    setWorking(false)

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Card className={cn('flex flex-col gap-4', paused && 'border-warn-500/40 bg-warn-500/5')}>
      <div>
        <MicroLabel tone={paused ? 'accent' : 'muted'}>
          {paused ? 'Closed to new orders' : 'Open'}
        </MicroLabel>
        <p className="text-washi-50 mt-2">
          {paused
            ? 'Nobody can start a new assessment. Everyone already in the queue is unaffected — orders in flight can still be finished, reviewed and delivered.'
            : 'Anyone signed in can start a new assessment. Close this when the queue is longer than you can work through.'}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-err-500 text-sm">
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="button"
          variant={paused ? 'primary' : 'ghost'}
          onClick={toggle}
          loading={working}
        >
          {paused ? 'Reopen to new orders' : 'Close to new orders'}
        </Button>
      </div>
    </Card>
  )
}
