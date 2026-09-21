'use client'

import { useCallback, useState } from 'react'
import { Dropzone, FileRow, type FileRowState } from '@/components/ui/dropzone'
import { MicroLabel } from '@/components/ui/card'
import { allGuardrailsAcked, GUARDRAILS } from '@/lib/uploads/constants'
import {
  nextSampleVersion,
  recordUpload,
  removeUpload,
  saveGuardrails,
} from '@/lib/uploads/actions'
import { sampleObjectPath } from '@/lib/uploads/paths'
import { uploadSample } from '@/lib/uploads/upload-client'
import { validateFile } from '@/lib/uploads/validate'
import { Checkbox } from '@/components/ui/checkbox'

type Item = {
  key: string
  name: string
  size: number
  state: FileRowState
  /** Present once the row exists in the database. */
  fileId?: string
  /** Kept so a failed upload can be retried without re-picking the file. */
  file?: File
}

/**
 * Sample upload for wizard stage 2.
 *
 * Standalone so T08's re-upload panel can mount the same component: a
 * customer whose sample was rejected should meet exactly the interface they
 * met the first time, not a second, subtly different one.
 */
export function SampleUploader({
  orderId,
  buyerId,
  initialGuardrails = {},
  initialFiles = [],
  onUploaded,
}: {
  orderId: string
  buyerId: string
  initialGuardrails?: Record<string, boolean>
  initialFiles?: { id: string; file_name: string; size_bytes: number }[]
  /**
   * Called once a file has finished and its row exists. The re-upload panel
   * (T08) uses it to know a replacement is actually there before offering to
   * send the order back — the database refuses a resubmission without one,
   * and being told that after the fact would be a poor way to learn it.
   */
  onUploaded?: () => void
}) {
  const [guardrails, setGuardrails] = useState<Record<string, boolean>>(initialGuardrails)
  const [items, setItems] = useState<Item[]>(() =>
    initialFiles.map((f) => ({
      key: f.id,
      fileId: f.id,
      name: f.file_name,
      size: f.size_bytes,
      state: { kind: 'done' } as FileRowState,
    })),
  )

  const unlocked = allGuardrailsAcked(guardrails)

  const toggleGuardrail = async (id: string, checked: boolean) => {
    const next = { ...guardrails, [id]: checked }
    setGuardrails(next)
    try {
      await saveGuardrails(orderId, next)
    } catch {
      // A failed save is not worth blocking on: the checklist is re-derived
      // from this state on submit, and the customer keeps working.
    }
  }

  const startUpload = useCallback(
    async (file: File, key: string) => {
      const check = validateFile(file)
      if (!check.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.key === key ? { ...i, state: { kind: 'error', message: check.message } } : i,
          ),
        )
        return
      }

      try {
        const version = await nextSampleVersion(orderId)
        const path = sampleObjectPath({ buyerId, orderId, version, extension: check.extension })

        await uploadSample({
          file,
          path,
          onProgress: (percent) =>
            setItems((prev) =>
              prev.map((i) =>
                i.key === key ? { ...i, state: { kind: 'uploading', progress: percent } } : i,
              ),
            ),
        })

        const record = await recordUpload({
          orderId,
          bucketPath: path,
          fileName: file.name,
          mime: check.mime,
          sizeBytes: file.size,
        })

        setItems((prev) =>
          prev.map((i) =>
            i.key === key ? { ...i, fileId: record.id, state: { kind: 'done' } } : i,
          ),
        )
        onUploaded?.()
      } catch (error) {
        setItems((prev) =>
          prev.map((i) =>
            i.key === key
              ? {
                  ...i,
                  state: {
                    kind: 'error',
                    message: error instanceof Error ? error.message : 'That upload did not finish.',
                  },
                }
              : i,
          ),
        )
      }
    },
    [buyerId, orderId, onUploaded],
  )

  const addFiles = (files: FileList) => {
    const additions: Item[] = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      state: { kind: 'uploading', progress: 0 },
      file,
    }))

    setItems((prev) => [...prev, ...additions])
    for (const item of additions) {
      if (item.file) void startUpload(item.file, item.key)
    }
  }

  const retry = (key: string) => {
    const item = items.find((i) => i.key === key)
    if (!item?.file) return
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, state: { kind: 'uploading', progress: 0 } } : i)),
    )
    void startUpload(item.file, key)
  }

  const remove = async (key: string) => {
    const item = items.find((i) => i.key === key)
    // Drop the row optimistically; a failed delete restores it below.
    setItems((prev) => prev.filter((i) => i.key !== key))

    if (item?.fileId) {
      try {
        await removeUpload(item.fileId)
      } catch {
        setItems((prev) => [...prev, item])
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Sample guidelines</legend>
        <MicroLabel tone="muted">Before you upload</MicroLabel>
        <p className="text-inkl-900/70 mb-2 text-sm">
          A sample that misses any of these has to be redone, which costs you days. Please confirm
          each one.
        </p>
        {GUARDRAILS.map((g) => (
          <Checkbox
            key={g.id}
            label={g.label}
            checked={guardrails[g.id] === true}
            onChange={(e) => void toggleGuardrail(g.id, e.target.checked)}
          />
        ))}
      </fieldset>

      <Dropzone
        disabled={!unlocked}
        disabledReason="Confirm the four points above and the uploader will open."
        onFiles={addFiles}
      />

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          <MicroLabel tone="muted">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </MicroLabel>
          <div aria-live="polite" className="flex flex-col gap-3">
            {items.map((item) => (
              <FileRow
                key={item.key}
                name={item.name}
                size={item.size}
                state={item.state}
                onRemove={() => void remove(item.key)}
                onRetry={item.state.kind === 'error' ? () => retry(item.key) : undefined}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
