import type { Metadata } from 'next'
import { absoluteUrl, SITE_URL } from '@/lib/site'
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

const DESCRIPTION =
  'A personal, growth-oriented assessment of what your handwriting suggests about how you think and work. Read and written by hand, from ₹999.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tegaki — Handwriting Personality Assessment',
    template: '%s — Tegaki',
  },
  description: DESCRIPTION,
  applicationName: 'Tegaki',

  /**
   * WhatsApp and Instagram sharing is the acquisition channel, so the unfurl
   * is the storefront. Every URL here is absolute: a root-relative image
   * silently fails on LinkedIn and WhatsApp, and the failure looks like no
   * image rather than like a mistake.
   */
  openGraph: {
    type: 'website',
    siteName: 'Tegaki',
    title: 'Tegaki — Handwriting Personality Assessment',
    description: DESCRIPTION,
    url: absoluteUrl('/'),
    locale: 'en_IN',
    images: [
      {
        url: absoluteUrl('/og-cover.png'),
        width: 1200,
        height: 630,
        alt: 'Tegaki — what your handwriting suggests about you',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Tegaki — Handwriting Personality Assessment',
    description: DESCRIPTION,
    images: [absoluteUrl('/og-cover.png')],
  },

  // The signed-in surfaces set their own `robots: { index: false }`; the
  // marketing pages are the only ones meant to be found.
  robots: { index: true, follow: true },
  alternates: { canonical: absoluteUrl('/') },
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
