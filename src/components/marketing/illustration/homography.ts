/**
 * A 2-D projective transform from one quadrilateral to another, expressed
 * as a CSS `matrix3d()`.
 *
 * The analyst holds a real sheet of paper — drawn, so it has the slight
 * perspective a held page has: the bottom edge is wider than the top. The
 * handwriting on it is live HTML, laid out flat in the sheet's own
 * coordinate space and then mapped onto the drawn page with this transform,
 * so the words sit on the paper rather than floating in front of it.
 *
 * Standard eight-unknown solve (Heckbert 1989), Gaussian elimination with
 * partial pivoting. Runs once per sheet definition, at module load.
 */

export type Point = readonly [number, number]
export type Quad = readonly [Point, Point, Point, Point] // tl, tr, br, bl

export function homographyMatrix3d(from: Quad, to: Quad): string {
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = from[i] as Point
    const [X, Y] = to[i] as Point
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y])
    b.push(X)
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y])
    b.push(Y)
  }
  const h = solve(A, b)
  // h = [a b c d e f g h] with H = [[a b c],[d e f],[g h 1]]
  const a = h[0] ?? 0
  const bb = h[1] ?? 0
  const c = h[2] ?? 0
  const d = h[3] ?? 0
  const e = h[4] ?? 0
  const f = h[5] ?? 0
  const g = h[6] ?? 0
  const hh = h[7] ?? 0
  // CSS matrix3d is column-major; the projective row goes into the 4th column.
  const m = [a, d, 0, g, bb, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1]
  return `matrix3d(${m.map((v) => round(v)).join(',')})`
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M: number[][] = A.map((row, i) => [...row, b[i] ?? 0])
  const at = (r: number, c: number) => M[r]?.[c] ?? 0
  const set = (r: number, c: number, v: number) => {
    const row = M[r]
    if (row) row[c] = v
  }
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(at(r, col)) > Math.abs(at(pivot, col))) pivot = r
    if (pivot !== col) {
      const tmp = M[col] as number[]
      M[col] = M[pivot] as number[]
      M[pivot] = tmp
    }
    const p = at(col, col)
    if (Math.abs(p) < 1e-12) throw new Error('homography: degenerate quad')
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = at(r, col) / p
      if (factor === 0) continue
      for (let k = col; k <= n; k++) set(r, k, at(r, k) - factor * at(col, k))
    }
  }
  return M.map((_, i) => at(i, n) / at(i, i))
}

function round(v: number) {
  // Enough precision for the projective terms, which are ~1e-4.
  return Number(v.toPrecision(8))
}
