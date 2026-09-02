'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { eraseOrderData } from '@/lib/admin/actions'

type Mode = 'redact' | 'erase'

/**
 * Delete-my-data, for one order.
 *
 * The dialog names exactly what goes and exactly what stays, because "delete
 * my data" is two different requests and the person asking is entitled to
 * choose which one they made. Redacting keeps the row so a later "did you
 * ever charge me?" has an honest answer; erasing leaves nothing to answer
 * with. Neither is more correct — they cost different things.
 *
 * The typed confirmation is not theatre. Every other destructive control in
 * this product is reversible; this one is not, and it sits on a page the
 * analyst visits for ordinary work.
 */
export function EraseData({ orderId }: { orderId: string }) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<Mode>('redact')
  const [confirmation, setConfirmation] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const shortId = orderId.slice(0, 8).toUpperCase()

  async function run() {
    setWorking(true)
    setError(null)

    const result = await eraseOrderData({ orderId, erase: mode === 'erase', confirmation })
    setWorking(false)

    if (result.error) {
      setError(result.error)
      return
    }

    dialog.current?.close()
    setConfirmation('')
    setDone(
      mode === 'erase'
        ? 'The order and everything attached to it are gone.'
        : `Files and personal details deleted. The order row remains for the records${
            result.objectsDeleted ? ` · ${result.objectsDeleted} file(s) removed` : ''
          }.`,
    )
    router.refresh()
  }

  if (done) {
    return (
      <Card className="flex flex-col gap-2">
        <MicroLabel tone="muted">Data erased</MicroLabel>
        <p className="text-washi-300 text-sm">{done}</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <MicroLabel tone="muted">Delete-my-data</MicroLabel>
      <p className="text-washi-300 text-sm">
        If this customer has asked to be forgotten, erase their data here. This cannot be undone,
        and the retention job will not do it for you — that job only runs 90 days after delivery.
      </p>

      <div>
        <Button
          type="button"
          variant="quiet"
          onClick={() => {
            setError(null)
            dialog.current?.showModal()
          }}
        >
          Erase this order&rsquo;s data
        </Button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="erase-title"
        className="border-ink-700 bg-ink-900 text-washi-50 m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border p-6 backdrop:bg-black/60"
      >
        <h2 id="erase-title" className="text-washi-50 font-serif text-2xl">
          Erase order {shortId}
        </h2>

        <fieldset className="mt-5 flex flex-col gap-3 border-0 p-0">
          <legend className="sr-only">What to delete</legend>

          <label className="border-ink-700 flex cursor-pointer gap-3 rounded-2xl border p-4">
            <input
              type="radio"
              name="erase-mode"
              className="accent-shu-500 mt-1"
              checked={mode === 'redact'}
              onChange={() => setMode('redact')}
            />
            <span>
              <span className="text-washi-50 block text-sm font-semibold">
                Delete their data, keep the record
              </span>
              <span className="text-washi-300 mt-1 block text-sm">
                Removes the handwriting samples, the report PDF and every personal detail — name,
                email, phone, city, age. Keeps the order row with its dates, tier and payment, so
                the books still balance.
              </span>
            </span>
          </label>

          <label className="border-ink-700 flex cursor-pointer gap-3 rounded-2xl border p-4">
            <input
              type="radio"
              name="erase-mode"
              className="accent-shu-500 mt-1"
              checked={mode === 'erase'}
              onChange={() => setMode('erase')}
            />
            <span>
              <span className="text-washi-50 block text-sm font-semibold">
                Delete everything, including the record
              </span>
              <span className="text-washi-300 mt-1 block text-sm">
                Removes the order itself along with its files, report and payment row. Nothing
                remains — you will not be able to answer a later question about this order.
              </span>
            </span>
          </label>
        </fieldset>

        <label htmlFor="erase-confirm" className="text-washi-300 mt-5 block text-sm">
          Type <strong className="text-washi-50 font-mono">{shortId}</strong> to confirm.
        </label>
        <input
          id="erase-confirm"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="border-ink-700 bg-ink-950 text-washi-50 mt-2 w-full rounded-lg border px-3 py-2 font-mono text-sm"
        />

        {error ? (
          <p
            role="alert"
            className="border-err-500/40 bg-err-500/10 text-washi-50 mt-4 rounded-lg border px-4 py-3 text-sm"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={() => {
              setConfirmation('')
              setError(null)
              dialog.current?.close()
            }}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" loading={working} onClick={run}>
            Erase permanently
          </Button>
        </div>
      </dialog>
    </Card>
  )
}
