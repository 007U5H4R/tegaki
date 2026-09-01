'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './button'

/**
 * Dropzone shell and file rows — Design.md §3.4.
 *
 * Presentation only: T04 wires the actual upload. Splitting them means the
 * riskiest ticket in the build (private storage, RLS, signed URLs) is not
 * also the ticket inventing a drag-and-drop UI at the same time.
 */

export function Dropzone({
  disabled = false,
  disabledReason,
  hint = 'JPG, PNG or PDF · up to 20 MB each',
  onFiles,
  className,
}: {
  disabled?: boolean
  /** Shown in place of the prompt — say why it is locked, never just grey it out. */
  disabledReason?: string
  hint?: string
  onFiles?: (files: FileList) => void
  className?: string
}) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (disabled) return
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files.length) onFiles?.(e.dataTransfer.files)
      }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center',
        'duration-pop transition-[border-color,transform] ease-out',
        disabled
          ? 'border-ink-700 opacity-60'
          : dragging
            ? 'border-shu-500 scale-[1.01]'
            : 'border-ink-700',
        className,
      )}
    >
      {disabled && disabledReason ? (
        <p className="text-washi-300 text-sm">{disabledReason}</p>
      ) : (
        <>
          <p className="text-washi-50">Drag your photos here</p>
          <p className="text-washi-300 text-xs">{hint}</p>
          <label className="mt-2">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => e.target.files && onFiles?.(e.target.files)}
            />
            <Button asChild variant="ghost" size="sm">
              <span role="button" tabIndex={0}>
                Choose files
              </span>
            </Button>
          </label>
        </>
      )}
    </div>
  )
}

export type FileRowState =
  { kind: 'uploading'; progress: number } | { kind: 'done' } | { kind: 'error'; message: string }

export function FileRow({
  name,
  size,
  state,
  onRemove,
  onRetry,
}: {
  name: string
  /** Bytes. */
  size: number
  state: FileRowState
  onRemove?: () => void
  onRetry?: () => void
}) {
  return (
    <div className="border-ink-700 bg-ink-900 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-washi-50 truncate text-sm">{name}</p>
          <p className="text-ink-500 font-mono text-xs">{formatBytes(size)}</p>
        </div>

        {state.kind === 'error' && onRetry ? (
          <Button variant="quiet" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
            className="text-ink-500 duration-press hover:text-washi-50 flex size-11 items-center justify-center rounded-full transition-colors ease-out"
          >
            <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {state.kind === 'uploading' ? (
        <div
          className="bg-ink-800 h-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={Math.round(state.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Uploading ${name}`}
        >
          {/* scaleX rather than width: transforms skip layout and paint. */}
          <div
            className="bg-shu-500 duration-pop h-full origin-left transition-transform ease-out"
            style={{ transform: `scaleX(${state.progress / 100})` }}
          />
        </div>
      ) : null}

      {state.kind === 'error' ? <p className="text-err-500 text-xs">{state.message}</p> : null}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
