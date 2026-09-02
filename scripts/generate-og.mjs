#!/usr/bin/env node
/**
 * Render the link-preview image.
 *
 * WhatsApp and Instagram sharing is the entire acquisition channel for this
 * pilot, which makes the unfurl the storefront — the first Tegaki most people
 * will ever see is a 1200×630 card in somebody's chat.
 *
 * It is rendered in a real browser with the real fonts rather than generated
 * by a diffusion model. A wordmark has to be crisp at 100%, and no image
 * model can be trusted to spell. Chromium is already here for the test suite,
 * so this needs no new dependency.
 *
 * Checked in as a static PNG rather than produced per-request: a crawler that
 * gets a slow or failed response caches the failure, and a preview that is
 * broken on first paste is broken for everyone who sees that message.
 *
 * Run: pnpm og
 */

import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}public/og-cover.png`

// The same outline the app renders, read from the component so the mark on
// the card and the mark on the site can never drift apart.
const sealSource = readFileSync(`${ROOT}src/components/brand/seal.tsx`, 'utf8')
const glyph = sealSource.match(/const GLYPH_TE =\s*\n?\s*'([^']+)'/)?.[1]
if (!glyph) throw new Error('could not read the seal glyph from seal.tsx')

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;600&family=Noto+Serif+JP:wght@400&display=block" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#0d0b06;color:#f7e8d2;
       font-family:Manrope,system-ui,sans-serif;
       display:flex;flex-direction:column;justify-content:space-between;
       padding:76px 84px;overflow:hidden}
  .grain{position:absolute;inset:0;
         background:radial-gradient(120% 90% at 78% 18%, rgba(218,69,44,.14), transparent 62%)}
  .row{display:flex;align-items:center;gap:22px;position:relative}
  .mark{width:76px;height:76px;flex:none}
  .word{font-family:'Instrument Serif',Georgia,serif;font-size:60px;line-height:1}
  .jp{font-family:'Noto Serif JP',serif;font-size:26px;color:#d9c9ad;margin-left:4px}
  h1{font-family:'Instrument Serif',Georgia,serif;font-size:78px;line-height:1.06;
     max-width:19ch;font-weight:400;position:relative}
  .foot{display:flex;align-items:baseline;justify-content:space-between;
        font-size:21px;color:#d9c9ad;position:relative}
  .mono{font-family:ui-monospace,'SF Mono',monospace;font-size:18px;
        letter-spacing:.09em;text-transform:uppercase;color:#da452c}
</style></head>
<body>
  <div class="grain"></div>

  <div class="row">
    <svg class="mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="43" stroke="#da452c" stroke-width="7.5"/>
      <path d="${glyph}" fill="#da452c"/>
    </svg>
    <span class="word">Tegaki</span>
    <span class="jp">手書き</span>
  </div>

  <h1>What your handwriting suggests about you.</h1>

  <div class="foot">
    <span>Read and written by hand · from ₹999</span>
    <span class="mono">tegaki-one.vercel.app</span>
  </div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const png = await page.screenshot({ type: 'png' })
await browser.close()

writeFileSync(OUT, png)
console.log(`og-cover.png — ${(png.length / 1024).toFixed(0)} KB, 1200×630`)
