'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Form field primitives — Design.md §3.4 and the §5.2 accessibility gates.
 *
 * The label is always visible. Placeholder-as-label is the single most common
 * form mistake: it disappears the moment someone types, so anyone who is
 * interrupted mid-form loses the only clue about what a box was for.
 *
 * Errors are wired through `aria-describedby` rather than merely coloured, so
 * a screen reader hears the problem instead of just a red rectangle.
 */

type FieldProps = {
  label: string
  /** Guidance shown under the label — say why you need a thing, not how to type it. */
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (ids: {
    id: string
    describedBy: string | undefined
    invalid: boolean
  }) => React.ReactNode
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={id}
        className="text-washi-50 in-[[data-theme=paper]]:text-inkl-900 text-sm font-medium"
      >
        {label}
        {required ? (
          <span className="text-shu-500 in-[[data-theme=paper]]:text-shu-700 ml-1" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-ink-500 in-[[data-theme=paper]]:text-inkl-900/55 ml-2 text-xs font-normal">
            optional
          </span>
        )}
      </label>

      {hint ? (
        <p id={hintId} className="text-washi-300 in-[[data-theme=paper]]:text-inkl-900/65 text-xs">
          {hint}
        </p>
      ) : null}

      {children({ id, describedBy: describedBy || undefined, invalid: Boolean(error) })}

      {error ? (
        <p id={errorId} className="text-err-500 in-[[data-theme=paper]]:text-err-700 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const control = [
  'w-full rounded-lg border bg-ink-900 px-4 py-3 text-base text-washi-50',
  'placeholder:text-ink-500',
  'in-[[data-theme=paper]]:bg-paper-100 in-[[data-theme=paper]]:text-inkl-900 in-[[data-theme=paper]]:placeholder:text-inkl-900/45',
  'transition-[border-color] duration-press ease-out',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const controlBorder = (invalid: boolean) =>
  invalid
    ? 'border-err-500 in-[[data-theme=paper]]:border-err-700'
    : 'border-ink-700 hover:border-ink-500 in-[[data-theme=paper]]:border-inkl-900/15 in-[[data-theme=paper]]:hover:border-inkl-900/30'

export function Input({
  invalid,
  className,
  ...props
}: React.ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(control, controlBorder(Boolean(invalid)), 'min-h-11', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Textarea({
  invalid,
  className,
  ...props
}: React.ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(control, controlBorder(Boolean(invalid)), 'min-h-24 resize-y', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
