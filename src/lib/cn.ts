import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones
 * in the same group. Without twMerge, a caller passing `px-8` to a component
 * whose base has `px-6` gets both, and the winner is whichever CSS rule
 * happens to come last in the stylesheet — an invisible, order-dependent bug.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
