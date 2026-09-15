'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { homographyMatrix3d, type Quad } from './illustration/homography'
import { MARK_AT, MARK_ORDER, NOTES, type MarkId } from './illustration/marks'
import { SHEET_LOCAL, SheetContent, type HotHandlers } from './illustration/sheet'

/**
 * The hero illustration, with its behaviour.
 *
 * The artwork is a set of Higgs renders in the approved editorial style,
 * each a transparent cutout so the scene has depth and the moving parts can
 * move: the wall props behind, the plant, the analyst in his armchair
 * holding a blank page, the side table with the mug and books, the cat, and
 * the tall books in the right foreground.
 *
 * The page he holds is blank in the render. The handwriting, the date and
 * the red-pencil marks are live HTML laid out flat in the sheet's own
 * coordinate space and mapped onto the drawn page with a projective
 * transform (`SHEET_QUAD`, measured on the render), so the words sit on the
 * paper and the hotspots are real, focusable text.
 *
 * Behaviour:
 *  - ~0.9s after load the circle around "grateful" draws itself and its
 *    note appears; the two margin notes follow at ~1.65s and ~2.3s.
 *  - a hotspot opens the analyst's explanation on hover / focus; a tap
 *    pins it (touch has no hover). Leaving closes the note; the mark stays.
 *  - he blinks every ~7s (two skin-toned lids over the drawn eyes).
 *  - the cat breathes; near the cursor one eye opens for a moment and a
 *    tiny "still here." appears, then both go again.
 *  - the scene follows a fine pointer by ±2px (HeroMotion writes --px/--py).
 */

/** The analyst render's pixel space; every coordinate below is in it. */
const ART = { w: 1600, h: 1280 }

/** The blank page's corners on the render: tl, tr, br, bl. */
const SHEET_QUAD: Quad = [
  [546, 193],
  [995, 246],
  [1100, 840],
  [528, 718],
]

const SHEET_MATRIX = homographyMatrix3d(
  [
    [0, 0],
    [SHEET_LOCAL.w, 0],
    [SHEET_LOCAL.w, SHEET_LOCAL.h],
    [0, SHEET_LOCAL.h],
  ],
  SHEET_QUAD,
)

/** His eyes, behind the glasses. Lids are skin-toned ellipses over them. */
const EYES = { skin: '#e2a274', a: { cx: 1000, cy: 241 }, b: { cx: 1059, cy: 246 } }

/** Cutouts. Intrinsic sizes are declared so nothing lays out on load. */
const ART_SRC = {
  analyst: { src: '/illo/analyst.webp', w: 1600, h: 1280 },
  cat: { src: '/illo/cat.webp', w: 900, h: 672 },
  plant: { src: '/illo/plant.webp', w: 747, h: 1000 },
  books: { src: '/illo/books.webp', w: 800, h: 800 },
  table: { src: '/illo/table.webp', w: 800, h: 800 },
  print: { src: '/illo/print.webp', w: 500, h: 500 },
  shelf: { src: '/illo/shelf.webp', w: 720, h: 900 },
} as const

function useMarks(interactive: boolean, autoDraw: boolean) {
  const [drawn, setDrawn] = useState<Set<MarkId>>(() => new Set())
  const [active, setActive] = useState<MarkId | null>(null)
  const [pinned, setPinned] = useState<MarkId | null>(null)

  // The load sequence: one mark at a time, in the analyst's order.
  useEffect(() => {
    if (!autoDraw) return
    const timers = MARK_ORDER.map((id) =>
      window.setTimeout(() => setDrawn((s) => new Set(s).add(id)), MARK_AT[id]),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [autoDraw])

  const show = useCallback((id: MarkId) => {
    setDrawn((s) => (s.has(id) ? s : new Set(s).add(id)))
    setActive(id)
  }, [])

  const handlers: HotHandlers = {
    active: active ?? pinned,
    onEnter: interactive
      ? (id, pointerType) => {
          if (pointerType === 'touch') return
          show(id)
        }
      : undefined,
    onLeave: interactive
      ? (id, pointerType) => {
          if (pointerType === 'touch') return
          if (pinned !== id) setActive((a) => (a === id ? null : a))
        }
      : undefined,
    // Tap (or Enter) toggles and pins, so touch users can read the note.
    onToggle: interactive
      ? (id) => {
          if (pinned === id) {
            setPinned(null)
            setActive(null)
            return
          }
          setPinned(id)
          show(id)
        }
      : undefined,
  }

  const dismiss = useCallback(() => {
    setPinned(null)
    setActive(null)
  }, [])

  return { drawn, handlers, open: active ?? pinned, dismiss }
}

/* -------------------------------------------------------------------------- */

export function HeroScene({
  className,
  interactive = true,
}: {
  className?: string
  /** Phones show the scene as a picture; the flat sheet above it carries the interaction. */
  interactive?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const figure = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const { drawn, handlers, open, dismiss } = useMarks(interactive, true)
  const [notePos, setNotePos] = useState<{
    id: MarkId
    left: number
    top: number
    side: 'left' | 'right'
  } | null>(null)

  // The render's 1600px space is scaled to the width the figure actually
  // gets. One measurement, re-done on resize; the CSS does the rest.
  useLayoutEffect(() => {
    const el = figure.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / ART.w)
    // A layout effect exists to read layout before paint; without this first
    // synchronous read the sheet is invisible until the observer's first
    // report, which on a cold load arrived a frame late or not at all.
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Place the explanation beside whatever was touched, inside the scene.
  const onAnchor = useCallback((id: MarkId, el: HTMLElement) => {
    const scene = root.current
    if (!scene) return
    const r = el.getBoundingClientRect()
    const c = scene.getBoundingClientRect()
    const noteW = 248
    const rightOf = r.right - c.left + 14
    const fitsRight = rightOf + noteW < c.width - 8
    setNotePos({
      id,
      side: fitsRight ? 'left' : 'right',
      left: fitsRight ? rightOf : Math.max(8, r.left - c.left - noteW - 14),
      top: Math.max(0, r.top - c.top - 10),
    })
  }, [])

  // Tap outside dismisses a pinned note.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.hot') || t.closest('.paper-note')) return
      dismiss()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, dismiss])

  const note = notePos && open === notePos.id ? notePos : null

  return (
    <div ref={root} className={cn('relative', className)} style={{ aspectRatio: '1.22' }}>
      {/* ---- wall: art print and the taped note, faintly parallaxed ---- */}
      <div className="props-move absolute inset-0" aria-hidden>
        <Cutout art={ART_SRC.print} className="absolute top-[6%] left-[29%] w-[12.5%]" />
        <TapedNote className="absolute top-[7%] left-[44%] w-[14.5%]" />
      </div>

      {/* ---- the scene itself: one group that settles, then breathes ---- */}
      <div className="scene-move absolute inset-0">
        {/* the plant stands behind the side table; its own stand is hidden */}
        <Cutout
          art={ART_SRC.plant}
          className="absolute bottom-[14%] left-[-2%] w-[42%]"
          style={{ clipPath: 'inset(0 0 21% 0)' }}
        />
        <Cutout art={ART_SRC.table} className="absolute bottom-[-2%] left-[2%] w-[27%]" />
        <Cutout art={ART_SRC.books} className="absolute bottom-[17%] left-[5%] w-[21%]" />

        {/* analyst + chair, with the live sheet mapped onto his page */}
        <div
          ref={figure}
          className="absolute bottom-[1%] left-[19%] w-[92%]"
          style={{ aspectRatio: `${ART.w} / ${ART.h}` }}
        >
          <img
            src={ART_SRC.analyst.src}
            width={ART_SRC.analyst.w}
            height={ART_SRC.analyst.h}
            alt="The analyst, sunk into a rust armchair with his socked feet up, a red pencil at his cheek, reading a large page of handwriting."
            className="block h-full w-full"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />

          {/* everything below is in the render's 1600×1280 space */}
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ width: ART.w, height: ART.h, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ width: SHEET_LOCAL.w, height: SHEET_LOCAL.h, transform: SHEET_MATRIX }}
            >
              <SheetContent drawn={drawn} interactive={interactive} handlers={{ ...handlers, onAnchor }} />
            </div>

            {/* eyelids */}
            <svg
              aria-hidden
              viewBox={`0 0 ${ART.w} ${ART.h}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <ellipse className="eyelid" data-eye="a" cx={EYES.a.cx} cy={EYES.a.cy} rx="17" ry="12" fill={EYES.skin} />
              <ellipse className="eyelid" data-eye="b" cx={EYES.b.cx} cy={EYES.b.cy} rx="17" ry="12" fill={EYES.skin} />
            </svg>
          </div>
        </div>

        {/* the cat sleeps on the floor at the chair's front-right foot, on the
            same baseline as the chair legs and the tall books */}
        <Cat className="absolute bottom-[-0.5%] left-[63%] w-[27%]" />
        <Cutout art={ART_SRC.shelf} className="absolute right-[-3%] bottom-[-1%] w-[13%]" />
      </div>

      {/* ---- the analyst's explanation, placed beside what was touched ---- */}
      {MARK_ORDER.map((id) => (
        <PaperNote
          key={id}
          id={id}
          open={note?.id === id}
          side={note?.id === id ? note.side : 'left'}
          style={note?.id === id ? { left: note.left, top: note.top } : { left: 0, top: 0 }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Phones: the sheet as a flat piece of paper a thumb can reach, with the
 * analyst's note in a slot underneath. Tap a red mark to read; tap again
 * (or anywhere else) to close.
 */
export function MobileSheet({ className }: { className?: string }) {
  const { drawn, handlers, open, dismiss } = useMarks(true, true)
  const [w, setW] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setW(el.clientWidth)
    // A layout effect exists to read layout before paint; without this first
    // synchronous read the sheet is invisible until the observer's first
    // report, which on a cold load arrived a frame late or not at all.
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.hot') || t.closest('.paper-note')) return
      dismiss()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, dismiss])

  const s = w ? w / SHEET_LOCAL.w : 0

  return (
    <div className={cn('relative', className)}>
      <div
        ref={box}
        className="bg-paper-50 grain relative -rotate-1 shadow-[0_1px_0_rgba(0,0,0,0.25)]"
        style={{ aspectRatio: `${SHEET_LOCAL.w} / ${SHEET_LOCAL.h}` }}
        role="img"
        aria-label="A page of handwriting with three red-pencil notes: an outward slant, even spacing and a steady baseline."
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `scale(${s})`, visibility: s ? 'visible' : 'hidden' }}
        >
          <SheetContent drawn={drawn} interactive handlers={handlers} />
        </div>
      </div>

      <div className="relative mt-5 min-h-[7.5rem]" aria-live="polite">
        {MARK_ORDER.map((id) => (
          <PaperNote
            key={id}
            id={id}
            open={open === id}
            side="none"
            style={{ position: 'absolute', left: 0, top: 0, width: 'min(100%, 22rem)' }}
          />
        ))}
        {open ? null : (
          <p className="font-hand text-paper-50/80 text-xl leading-tight">
            tap a red mark to see what it says ↑
          </p>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Cutout({
  art,
  className,
  style,
  alt = '',
}: {
  art: { src: string; w: number; h: number }
  className?: string
  style?: React.CSSProperties
  alt?: string
}) {
  return (
    <img
      src={art.src}
      width={art.w}
      height={art.h}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      className={cn('block h-auto', className)}
      style={style}
    />
  )
}

/** A scrap of paper taped to the wall, in the analyst's hand. */
function TapedNote({ className }: { className?: string }) {
  return (
    <div className={cn('rotate-[4deg]', className)} aria-hidden>
      <div className="bg-paper-50 relative px-[9%] pt-[16%] pb-[12%] shadow-[0_1px_0_rgba(60,20,10,0.35)]">
        {/* the tape */}
        <span className="bg-paper-100/80 absolute -top-[6%] left-[32%] h-[12%] w-[36%] -rotate-3 opacity-90" />
        <p className="font-hand text-inkl-900 text-center text-[clamp(0.6rem,1.05vw,0.95rem)] leading-[1.05] font-medium">
          Curiosity
          <br />
          looks good
          <br />
          on you.
        </p>
      </div>
    </div>
  )
}

/** The cat: asleep, breathing. Near the cursor, one eye opens for a moment. */
function Cat({ className }: { className?: string }) {
  const [awake, setAwake] = useState(false)
  const timer = useRef(0)

  const wake = () => {
    if (awake) return
    setAwake(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAwake(false), 1500)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div
      className={cn('cat-breathe', className)}
      data-cat-awake={awake ? 'true' : undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return
        wake()
      }}
      style={{ aspectRatio: `${ART_SRC.cat.w} / ${ART_SRC.cat.h}` }}
    >
      <img
        src={ART_SRC.cat.src}
        width={ART_SRC.cat.w}
        height={ART_SRC.cat.h}
        alt="A ginger-and-cream cat, asleep on the arm of the chair."
        decoding="async"
        className="block h-auto w-full"
      />
      {/* the eye that opens: over the drawn closed eye */}
      <svg
        aria-hidden
        viewBox="0 0 900 672"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g className="cat-eye">
          <path d="M 494 306 C 506 292 532 292 544 306 C 532 318 506 318 494 306 Z" fill="#f2e6cf" />
          <ellipse cx="519" cy="306" rx="6" ry="9" fill="#1d2a2a" />
        </g>
      </svg>
      <span
        aria-hidden
        className="cat-note font-hand text-paper-50 absolute -top-[10%] left-[14%] text-[clamp(0.8rem,1.3vw,1.15rem)] leading-none -rotate-3"
      >
        still here.
      </span>
    </div>
  )
}

/** The analyst's explanation, as a scrap of paper placed on the scene. */
function PaperNote({
  id,
  open,
  side,
  style,
}: {
  id: MarkId
  open: boolean
  side: 'left' | 'right' | 'none'
  style?: React.CSSProperties
}) {
  const note = NOTES[id]
  return (
    <div
      className="paper-note"
      data-open={open ? 'true' : undefined}
      data-side={side === 'none' ? undefined : side}
      aria-hidden={!open}
      role="note"
      style={style}
    >
      <p className="font-hand text-pencil-600 text-[1.15rem] leading-none font-semibold">{note.title}</p>
      <p className="font-mono mt-2.5 text-[0.62rem] tracking-[0.1em] uppercase opacity-70">What we notice</p>
      <p className="mt-0.5 text-[0.83rem] leading-snug">{note.notice}</p>
      <p className="font-mono mt-2 text-[0.62rem] tracking-[0.1em] uppercase opacity-70">What it may suggest</p>
      <p className="mt-0.5 text-[0.83rem] leading-snug">{note.suggest}</p>
    </div>
  )
}
