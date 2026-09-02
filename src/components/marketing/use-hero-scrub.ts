'use client'

import { useEffect, useState } from 'react'

export const FRAME_COUNT = 180

export function framePath(index: number): string {
  return `/hero/hero_${String(index + 1).padStart(3, '0')}.jpg`
}

/**
 * May this visitor have the scroll-scrub film?
 *
 * Three conditions, and the order matters because the answer gates a **6.8 MB
 * download**. Design.md §3.2-1 is explicit that the scrub is a desktop and
 * tablet enhancement and "never a mobile data tax" — this product's audience
 * is on mid-range Android over Indian mobile data, and 6.8 MB of frames they
 * will never see is a real cost to a real person.
 *
 * So the fetch lives behind this, not merely the rendering. `false` until the
 * effect runs, which also means the server and the first client paint agree:
 * everybody gets the static hero, and only then does an eligible desktop
 * upgrade itself.
 */
export function useHeroScrubEligible(): boolean {
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 769px)')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')

    const decide = () => setEligible(wide.matches && !still.matches)
    decide()

    wide.addEventListener('change', decide)
    still.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      still.removeEventListener('change', decide)
    }
  }, [])

  return eligible
}

export type FrameLoad = { images: HTMLImageElement[]; progress: number; ready: boolean }

/**
 * Fetch the frame set with bounded concurrency.
 *
 * `HTMLImageElement` rather than `ImageBitmap`: a decoded 1280×720 bitmap is
 * about 3.7 MB, so holding 180 of them would cost roughly 660 MB of memory.
 * Image elements let the browser keep the compressed bytes and manage its own
 * decode cache, which is the difference between a smooth scrub and a tab the
 * operating system kills.
 *
 * An AbortController stops the queue if the visitor leaves mid-load — there is
 * no reason to keep pulling megabytes for a page nobody is looking at.
 */
export function useFrames(enabled: boolean): FrameLoad {
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const loaded: HTMLImageElement[] = new Array(FRAME_COUNT)
    let done = 0
    let next = 0

    const one = (index: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.src = framePath(index)
        const finish = () => {
          loaded[index] = img
          done += 1
          if (!controller.signal.aborted) setProgress(done / FRAME_COUNT)
          resolve()
        }
        img.onload = finish
        // A missing frame must not stall the whole film; the scrub simply
        // holds the previous one.
        img.onerror = finish
      })

    async function worker() {
      while (next < FRAME_COUNT && !controller.signal.aborted) {
        await one(next++)
      }
    }

    // Six at a time: enough to saturate a connection, few enough that the
    // first frames — the ones a visitor sees immediately — arrive first.
    Promise.all(Array.from({ length: 6 }, worker)).then(() => {
      if (!controller.signal.aborted) setImages(loaded)
    })

    return () => controller.abort()
  }, [enabled])

  return { images, progress, ready: images.length === FRAME_COUNT }
}
