'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Checkbox and toggle — Design.md §3.4, Fitts's Law §3.8.
 *
 * The visible box is 20px but the whole label is the hit target, which keeps
 * the tap area comfortably past 44px without drawing an oversized box. The
 * native input stays in the DOM (visually hidden, not `display: none`) so
 * keyboard focus, form submission and assistive tech all behave normally.
 */

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  label: React.ReactNode
  error?: string
}

export function Checkbox({ label, error, className, id: providedId, ...props }: CheckboxProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={cn(
          'group text-washi-50 flex cursor-pointer items-start gap-3 py-2 text-base',
          className,
        )}
      >
        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            className="peer absolute size-full cursor-pointer opacity-0"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              'flex size-5 items-center justify-center rounded border',
              'duration-press transition-[background-color,border-color] ease-out',
              error ? 'border-err-500' : 'border-ink-500',
              'peer-checked:border-shu-500 peer-checked:bg-shu-500',
              'peer-focus-visible:outline-shu-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="text-washi-50 duration-press size-3 scale-90 opacity-0 transition-[opacity,transform] ease-out peer-checked:scale-100 peer-checked:opacity-100"
            >
              <path
                d="M3 8.5 6.5 12 13 4.5"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span className="text-pretty">{label}</span>
      </label>

      {error ? (
        <p id={errorId} className="text-err-500 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type ToggleProps = Omit<React.ComponentProps<'input'>, 'type'> & { label: React.ReactNode }

export function Toggle({ label, className, id: providedId, ...props }: ToggleProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <label
      htmlFor={id}
      className={cn(
        'text-washi-50 flex cursor-pointer items-center gap-3 py-2 text-base',
        className,
      )}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer absolute size-full cursor-pointer opacity-0"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            'bg-ink-700 h-6 w-11 rounded-full',
            'duration-press transition-[background-color] ease-out',
            'peer-checked:bg-shu-600',
            'peer-focus-visible:outline-shu-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          )}
        />
        <span
          aria-hidden
          className="bg-washi-50 duration-press pointer-events-none absolute left-0.5 size-5 rounded-full transition-transform ease-out peer-checked:translate-x-5"
        />
      </span>
      <span>{label}</span>
    </label>
  )
}
