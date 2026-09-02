'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, MicroLabel } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropzone, FileRow, type FileRowState } from '@/components/ui/dropzone'
import { attachReport } from '@/lib/reports/actions'
import { reportObjectPath, validateReportFile } from '@/lib/reports/constants'
import { uploadReport } from '@/lib/reports/upload-client'

type Staged = {
  name: string
  size: number
  path: string
  state: FileRowState
}

/**
 * Attaching the finished report — the last action in the whole product, and
 * the one with the strictest rule behind it.
 *
 * Solution-PRD §7.4: nothing unvalidated ever reaches a customer. Fulfilment
 * is manual, so that human read-through is the only thing between a generated
 * document and somebody's inbox. The attestation is therefore not a
 * formality: the checkbox gates the button here, the server action re-checks,
 * and `reports.validated_at` is `not null` in the database — a report row
 * cannot exist without one.
 *
 * The bytes go up first and the row is written second. If the upload succeeds
 * and the attach fails, the object is orphaned in a private bucket rather
 * than a customer seeing a completed order with nothing to download — the
 * safer of the two failures.
 */
export function ReportUpload({ orderId, subject }: { orderId: string; subject: string | null }) {
  const router = useRouter()
  const [file, setFile] = useState<Staged | null>(null)
  const [validated, setValidated] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function stage(files: FileList) {
    const picked = files[0]
    if (!picked) return

    setError(null)
    const check = validateReportFile(picked)
    if (!check.ok) {
      setError(check.message)
      return
    }

    const path = reportObjectPath(orderId)
    setFile({
      name: picked.name,
      size: picked.size,
      path,
      state: { kind: 'uploading', progress: 0 },
    })

    try {
      await uploadReport({
        file: picked,
        path,
        onProgress: (progress) =>
          setFile((prev) => (prev ? { ...prev, state: { kind: 'uploading', progress } } : prev)),
      })
      setFile((prev) => (prev ? { ...prev, state: { kind: 'done' } } : prev))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'That upload did not finish.'
      setFile((prev) => (prev ? { ...prev, state: { kind: 'error', message } } : prev))
    }
  }

  async function attach() {
    if (!file || file.state.kind !== 'done') return

    setWorking(true)
    setError(null)

    const result = await attachReport({
      orderId,
      bucketPath: file.path,
      fileName: file.name,
      sizeBytes: file.size,
      validated,
    })

    setWorking(false)

    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  const uploaded = file?.state.kind === 'done'

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <MicroLabel>Deliver the report</MicroLabel>
        <p className="text-washi-300 mt-2 text-sm">
          Attaching the PDF completes this order and makes it downloadable
          {subject ? ` by ${subject}` : ''}. There is no undo from here.
        </p>
      </div>

      {file ? (
        <FileRow
          name={file.name}
          size={file.size}
          state={file.state}
          onRemove={() => {
            setFile(null)
            setValidated(false)
          }}
        />
      ) : (
        <Dropzone
          hint="One PDF, up to 25 MB."
          accept="application/pdf"
          multiple={false}
          onFiles={(files) => void stage(files)}
        />
      )}

      <Checkbox
        name="validated"
        checked={validated}
        onChange={(e) => setValidated(e.target.checked)}
        label={
          <>
            I have read this report in full and validated it.
            <span className="text-washi-300 mt-1 block text-sm">
              Nothing unvalidated reaches a customer. This is recorded against the order with the
              time you confirmed it.
            </span>
          </>
        }
      />

      {error ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={attach} loading={working} disabled={!uploaded || !validated}>
          Attach and complete
        </Button>
        {!uploaded ? (
          <p className="text-washi-300 text-sm">Upload the PDF first.</p>
        ) : !validated ? (
          <p className="text-washi-300 text-sm">Confirm you have validated it.</p>
        ) : null}
      </div>
    </Card>
  )
}
