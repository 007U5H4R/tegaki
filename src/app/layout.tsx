import type { Metadata } from 'next'
import { Geist_Mono, Instrument_Serif, Manrope } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

// Japanese appears only as 手書き in the lockup and footer, so the face is
// subset to exactly those three glyphs — 1.3 KB (Design.md §2.2).
//
// This is deliberately next/font/local rather than next/font/google: the
// Google loader emitted 276 woff2 chunks totalling 8 MB for these three
// characters. The file here was produced from the upstream Noto Serif JP with
//   python3 -m fontTools.subset noto-full.woff2 --text="手書き" --flavor=woff2
// Regenerate the same way if the JP copy ever gains a character.
const notoSerifJp = localFont({
  src: '../fonts/noto-serif-jp-tegaki-subset.woff2',
  variable: '--font-noto-serif-jp',
  weight: '400',
  display: 'swap',
  // The Latin faces already cover the fallback; no metric adjustment needed
  // for three ideographs.
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  // The full Open Graph and Twitter Card set lands in T13, where it is
  // verified against LinkedIn, opengraph.xyz and a real WhatsApp paste.
  title: 'Tegaki — Handwriting Personality Assessment',
  description:
    'A personal, growth-oriented assessment of what your handwriting suggests about how you think and work.',
}

export const viewport = {
  // Must match the computed value of --color-ink-950, not an eyeballed hex.
  themeColor: '#0d0b06',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${manrope.variable} ${geistMono.variable} ${notoSerifJp.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
