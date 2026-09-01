/**
 * Temporary token specimen — the verification gate for T01/A5.
 * The real landing page arrives in T11; the styleguide route in T02.
 */

const inkSwatches = [
  ['ink-950', 'bg-ink-950'],
  ['ink-900', 'bg-ink-900'],
  ['ink-800', 'bg-ink-800'],
  ['ink-700', 'bg-ink-700'],
  ['ink-500', 'bg-ink-500'],
] as const

const accentSwatches = [
  ['washi-50', 'bg-washi-50'],
  ['washi-300', 'bg-washi-300'],
  ['shu-500', 'bg-shu-500'],
  ['shu-600', 'bg-shu-600'],
  ['shu-700', 'bg-shu-700'],
  ['shu-900', 'bg-shu-900'],
] as const

export default function TokenSpecimen() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-shu-500 font-mono text-xs tracking-[0.08em] uppercase">
        Tegaki · token specimen · T01
      </p>

      <h1 className="text-washi-50 mt-4 text-5xl">Your handwriting holds a story.</h1>

      <p className="text-washi-300 mt-4 max-w-[680px] text-lg">
        A personal, growth-oriented assessment of what your writing suggests about how you think and
        work — analyzed by hand, delivered as a considered report.
      </p>

      <p className="mt-6 text-3xl">
        <span className="font-jp text-washi-50">手書き</span>{' '}
        <span className="text-washi-300 text-base">— tegaki, Japanese for handwritten</span>
      </p>

      <hr className="border-ink-700 my-10 border-t border-dashed" />

      <section aria-labelledby="ink-heading">
        <h2
          id="ink-heading"
          className="text-washi-300 font-mono text-xs tracking-[0.08em] uppercase"
        >
          Ink — ground
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {inkSwatches.map(([name, cls]) => (
            <div key={name} className="border-ink-700 rounded-2xl border p-3">
              <div className={`h-12 rounded-lg ${cls}`} />
              <p className="text-washi-300 mt-2 font-mono text-xs">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="accent-heading" className="mt-8">
        <h2
          id="accent-heading"
          className="text-washi-300 font-mono text-xs tracking-[0.08em] uppercase"
        >
          Washi &amp; shu
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-6">
          {accentSwatches.map(([name, cls]) => (
            <div key={name} className="border-ink-700 rounded-2xl border p-3">
              <div className={`h-12 rounded-lg ${cls}`} />
              <p className="text-washi-300 mt-2 font-mono text-xs">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-ink-500 mt-10 font-mono text-xs">
        Components arrive in T02. Sign-in and the dashboard arrive later in T01.
      </p>
    </main>
  )
}
