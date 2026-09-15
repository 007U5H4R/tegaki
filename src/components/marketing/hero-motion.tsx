'use client'

import { useEffect } from 'react'

/**
 * Two numbers, written to CSS custom properties; the CSS does the moving.
 *
 *  --px / --py   (hero)  cursor position across the hero, −1…1. The sheet
 *                        follows it by ±2px. Fine pointers only.
 *  --hero-exit   (html)  0 while the hero fills the viewport, 1 once its
 *                        bottom edge has climbed halfway up. The sheet lifts,
 *                        the chair barely moves, the paper layer rises over
 *                        the terracotta and the red thread draws downward.
 *
 * One rAF-throttled scroll listener and one pointermove; both no-ops under
 * prefers-reduced-motion, where the CSS also ignores the variables.
 */
export function HeroMotion({ target }: { target: string }) {
  useEffect(() => {
    const hero = document.getElementById(target)
    if (!hero) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    if (still.matches) return

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        // Layout position, not the transformed rect: the hero counter-shifts
        // by this very variable, and reading the transformed box would feed
        // the value back into itself.
        const bottom = hero.offsetTop + hero.offsetHeight - window.scrollY
        const vh = window.innerHeight
        const t = Math.min(Math.max((vh - bottom) / (vh * 0.5), 0), 1)
        document.documentElement.style.setProperty('--hero-exit', t.toFixed(3))
      })
    }

    const onMove = (e: PointerEvent) => {
      if (!fine.matches) return
      const r = hero.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 2 - 1
      const y = ((e.clientY - r.top) / r.height) * 2 - 1
      hero.style.setProperty('--px', x.toFixed(3))
      hero.style.setProperty('--py', y.toFixed(3))
    }
    const onOut = () => {
      hero.style.setProperty('--px', '0')
      hero.style.setProperty('--py', '0')
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onOut)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onOut)
      document.documentElement.style.removeProperty('--hero-exit')
    }
  }, [target])

  return null
}
