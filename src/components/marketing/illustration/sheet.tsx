import type { MarkId } from './marks'

/**
 * The handwriting sheet's content: the journal passage, the date, and the
 * analyst's three red-pencil marks with their handwritten notes.
 *
 * Laid out flat in the sheet's own coordinate space (SHEET_LOCAL, in px),
 * so the same component renders twice: mapped onto the drawn page in the
 * analyst's hands with a projective transform (desktop), and as a flat
 * sheet of paper a thumb can reach (phones).
 *
 * The writing is real text in the handwriting face, skewed for the
 * rightward slant the first note points at. Each red mark is an SVG stroke
 * with `pathLength="100"`, so every stroke draws with the same dash maths
 * and nothing has to be measured.
 *
 * Hotspots are real words: "grateful" carries the circle, the last line of
 * the second paragraph carries the underline, and each red note is itself a
 * target. They are <button>s reset to look like text, so they are reachable
 * by keyboard and announce what they open.
 */

export const SHEET_LOCAL = { w: 380, h: 460 }

export type HotHandlers = {
  active: MarkId | null
  onEnter?: (id: MarkId, pointerType: string) => void
  onLeave?: (id: MarkId, pointerType: string) => void
  onToggle?: (id: MarkId) => void
  /** Called with the element that was activated, for note placement. */
  onAnchor?: (id: MarkId, el: HTMLElement) => void
}

const HOT_LABEL: Record<MarkId, string> = {
  slant: 'Open, empathetic (outward slant) — what we notice',
  spacing: 'Balanced thinking (even spacing) — what we notice',
  baseline: 'Resilient (steady baseline) — what we notice',
}

export function SheetContent({
  drawn,
  interactive,
  handlers,
  className,
}: {
  drawn: Set<MarkId>
  interactive: boolean
  handlers: HotHandlers
  className?: string
}) {
  const hot = (id: MarkId, children: React.ReactNode, extra?: string) =>
    interactive ? (
      <Hot id={id} handlers={handlers} className={extra}>
        {children}
      </Hot>
    ) : (
      <span className={extra}>{children}</span>
    )

  const at = (offset = 0) => ({ '--at': `${offset}ms`, '--len': 100 }) as React.CSSProperties
  const d = (id: MarkId) => (drawn.has(id) ? 'true' : undefined)

  return (
    <div
      className={`font-hand text-hand-500 relative select-none ${className ?? ''}`}
      style={{
        width: SHEET_LOCAL.w,
        height: SHEET_LOCAL.h,
        fontSize: 23,
        lineHeight: '32px',
        fontWeight: 500,
      }}
    >
      {/* the date, small, upper right */}
      <span
        aria-hidden
        className="absolute top-[26px] right-[26px] -rotate-3 text-[13px] leading-none tracking-wide"
      >
        12 Aug 2024
      </span>

      <div className="absolute top-[48px] left-[20px] right-[16px]" style={{ transform: 'skewX(-7deg)' }}>
        <p>
          Today I caught myself thinking
          <br />
          about how far I&rsquo;ve come. It
          <br />
          still feels unreal at times, but
          <br />
          I&rsquo;m{' '}
          {hot(
            'slant',
            <>
              grateful
              {/* the loose circle around the word */}
              <svg
                aria-hidden
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-[9px] -inset-y-[5px] h-[calc(100%+10px)] w-[calc(100%+18px)] overflow-visible"
                fill="none"
                stroke="var(--color-pencil-500)"
                strokeWidth="1.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              >
                <path
                  d="M 12 22 C 8 8 40 3 62 4 C 88 5 98 14 94 24 C 90 36 60 39 36 37 C 14 35 4 30 10 20"
                  pathLength={100}
                  className="mark"
                  data-drawn={d('slant')}
                  style={at()}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </>,
            'relative inline-block px-0.5',
          )}{' '}
          for the people
          <br />
          who make this journey meaningful.
        </p>

        <p className="mt-[24px]">
          There are days when I feel
          <br />
          overwhelmed, but I always find
          <br />
          a way to get back up. I think
          <br />
          {hot(
            'baseline',
            <>
              that&rsquo;s what keeps me going.
              {/* a level underline that stays level */}
              <svg
                aria-hidden
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-[3px] left-0 h-[8px] w-full overflow-visible"
                fill="none"
                stroke="var(--color-pencil-500)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path
                  d="M 1 5 C 20 3.5 45 6 70 4.5 C 84 3.8 93 5 99 4"
                  pathLength={100}
                  className="mark"
                  data-drawn={d('baseline')}
                  style={at()}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </>,
            'relative inline-block',
          )}
        </p>

        <p className="mt-[22px] text-[18px] leading-[26px]">
          Here&rsquo;s to a more intentional
          <br />
          and kind tomorrow.{' '}
          <span aria-hidden className="inline-block -rotate-6 text-[15px]">
            :)
          </span>
        </p>
      </div>

      {/* ---- the analyst's red-pencil notes, in his hand ---- */}

      {/* 1. open, empathetic (outward slant): note above the first line, a
             small curved pointer down to where the writing starts */}
      <div
        className="mark-note absolute top-[14px] left-[120px] w-[150px] -rotate-[7deg]"
        data-drawn={d('slant')}
        style={{ '--at': '380ms' } as React.CSSProperties}
      >
        {hot(
          'slant',
          <span className="text-pencil-600 block text-[12.5px] leading-[13px] font-medium">
            open, empathetic
            <br />
            <span className="text-[11px]">(outward slant)</span>
          </span>,
          'block',
        )}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 60 60"
        className="pointer-events-none absolute top-[24px] left-[78px] h-[42px] w-[42px] overflow-visible"
        fill="none"
        stroke="var(--color-pencil-500)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M 52 6 C 34 8 20 20 14 44 M 8 36 L 14 46 L 22 38"
          pathLength={100}
          className="mark"
          data-drawn={d('slant')}
          style={{ '--at': '260ms', '--len': 100, '--draw': '520ms' } as React.CSSProperties}
        />
      </svg>

      {/* 2. balanced thinking (even spacing): right margin beside the second
             paragraph, a short arrow into the line */}
      <div
        className="mark-note absolute top-[236px] right-[-4px] w-[78px] -rotate-[8deg]"
        data-drawn={d('spacing')}
        style={{ '--at': '340ms' } as React.CSSProperties}
      >
        {hot(
          'spacing',
          <span className="text-pencil-600 block text-[12.5px] leading-[13px] font-medium">
            balanced
            <br />
            thinking
            <br />
            <span className="text-[11px]">(even spacing)</span>
          </span>,
          'block',
        )}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 60 30"
        className="pointer-events-none absolute top-[262px] right-[64px] h-[22px] w-[44px] overflow-visible"
        fill="none"
        stroke="var(--color-pencil-500)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M 56 8 C 40 6 26 12 6 18 M 14 10 L 5 18 L 15 22"
          pathLength={100}
          className="mark"
          data-drawn={d('spacing')}
          style={{ '--at': '0ms', '--len': 100, '--draw': '480ms' } as React.CSSProperties}
        />
      </svg>

      {/* 3. resilient (steady baseline): below-right of the underlined line */}
      <div
        className="mark-note absolute top-[356px] right-[8px] w-[92px] -rotate-[6deg]"
        data-drawn={d('baseline')}
        style={{ '--at': '340ms' } as React.CSSProperties}
      >
        {hot(
          'baseline',
          <span className="text-pencil-600 block text-[12.5px] leading-[13px] font-medium">
            resilient
            <br />
            <span className="text-[11px]">(steady baseline)</span>
          </span>,
          'block',
        )}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 60 40"
        className="pointer-events-none absolute top-[334px] right-[92px] h-[28px] w-[40px] overflow-visible"
        fill="none"
        stroke="var(--color-pencil-500)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M 56 32 C 44 30 30 22 8 8 M 8 18 L 6 6 L 18 8"
          pathLength={100}
          className="mark"
          data-drawn={d('baseline')}
          style={{ '--at': '0ms', '--len': 100, '--draw': '480ms' } as React.CSSProperties}
        />
      </svg>
    </div>
  )
}

/** A word on the page that opens the analyst's note. Looks like text until touched. */
function Hot({
  id,
  handlers,
  className,
  children,
}: {
  id: MarkId
  handlers: HotHandlers
  className?: string
  children: React.ReactNode
}) {
  const open = handlers.active === id
  return (
    <button
      type="button"
      className={`hot ${className ?? ''}`}
      aria-expanded={open}
      aria-label={HOT_LABEL[id]}
      onPointerEnter={(e) => {
        handlers.onAnchor?.(id, e.currentTarget)
        handlers.onEnter?.(id, e.pointerType)
      }}
      onPointerLeave={(e) => handlers.onLeave?.(id, e.pointerType)}
      onFocus={(e) => {
        handlers.onAnchor?.(id, e.currentTarget)
        handlers.onEnter?.(id, 'keyboard')
      }}
      onBlur={() => handlers.onLeave?.(id, 'keyboard')}
      onClick={(e) => {
        handlers.onAnchor?.(id, e.currentTarget)
        handlers.onToggle?.(id)
      }}
    >
      {children}
    </button>
  )
}
