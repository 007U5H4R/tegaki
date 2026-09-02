#!/usr/bin/env node
/**
 * Rasterise the seal for the places that cannot take an SVG.
 *
 * Apple touch icons and the .ico fallback need bitmaps. Same source outline
 * as `src/app/icon.svg`, so there is one mark rather than three that drift.
 */
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const svg = readFileSync(`${ROOT}src/app/icon.svg`, 'utf8')

const browser = await chromium.launch()
for (const [file, size] of [['src/app/apple-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  )
  const png = await page.screenshot({ type: 'png', omitBackground: false })
  writeFileSync(`${ROOT}${file}`, png)
  console.log(file, `${size}×${size}`, `${(png.length / 1024).toFixed(0)} KB`)
  await page.close()
}
await browser.close()
