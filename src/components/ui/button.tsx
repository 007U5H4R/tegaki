import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * Motion, per Design.md §4.3 and Emil Kowalski's rules:
 *  - transition names its properties; never `transition: all`
 *  - `ease-out` here is our strong curve, because the theme overrides
 *    Tailwind's weak built-in (see globals.css)
 *  - active:scale-[0.97] gives the press instant physical feedback
 *  - hover motion is gated to fine pointers, since touch fires a phantom
 *    hover on tap and leaves the button stuck in its hover state
 */
const button = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,transform] duration-press ease-out',
    'active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
    // The hit area never drops below 44px even when the label is short.
    'min-h-11',
  ],
  {
    variants: {
      variant: {
        // The vermilion pill reads on both the dark ground and cream paper,
        // so primary needs no paper override — only a light label on the red.
        primary: 'bg-shu-600 text-washi-50 hover:bg-shu-700',
        ghost:
          'border border-washi-300/40 text-washi-50 hover:border-washi-50 in-[[data-theme=paper]]:border-inkl-900/30 in-[[data-theme=paper]]:text-inkl-900 in-[[data-theme=paper]]:hover:border-inkl-900',
        quiet:
          'text-washi-300 hover:text-washi-50 in-[[data-theme=paper]]:text-inkl-900/70 in-[[data-theme=paper]]:hover:text-inkl-900',
      },
      size: {
        md: 'px-6 py-3 text-base',
        sm: 'px-5 py-2 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof button> & {
    asChild?: boolean
    /**
     * Swaps the label for a spinner while keeping the button's width, so a
     * row of controls does not jump when one of them starts working.
     */
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span className="sr-only">Working…</span>
          <span aria-hidden className="invisible">
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

function Spinner() {
  return (
    <svg
      className="absolute size-4 animate-spin"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
