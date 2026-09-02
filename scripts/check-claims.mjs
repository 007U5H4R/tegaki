#!/usr/bin/env node
/**
 * The claims guard.
 *
 * Solution-PRD §2 commits Tegaki to an indicative voice: graphology is
 * offered as something to reflect on, never as a fact, a diagnosis or a
 * prediction. That is the difference between a growth tool and a fortune
 * teller, and it is exactly the kind of promise that erodes one confident
 * sentence at a time when somebody is writing marketing copy in a hurry.
 *
 * So it is checked mechanically — but only against **what a reader actually
 * reads**. The first version of this script grepped whole lines and produced
 * twenty-five false positives against a component called `Reveal` and
 * against its own explanatory comments. A guard that cries wolf gets
 * switched off, so this one strips comments and looks inside string literals
 * and JSX text only.
 *
 * Two words — "scientific" and "diagnosis" — appear legitimately when the
 * copy is DENYING them, which is the most important honesty on the page. Any
 * such use has to be listed in ALLOWED below, so the exceptions are
 * enumerated and reviewable rather than hidden inside a cleverer regex.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCANNED = ['src/content', 'src/components/marketing', 'src/app/(marketing)']

const BANNED = [
  { re: /\breveals?\b/i, why: 'states a fact about the reader; use "suggests" or "indicates"' },
  { re: /\bproves?\b|\bproven\b/i, why: 'claims proof' },
  { re: /\bwill\s+(make|give|show|tell|change|reveal)\b/i, why: 'predicts an outcome' },
  { re: /\bdestiny\b/i, why: 'fortune-telling register' },
  { re: /\bguarantee/i, why: 'promises an outcome the product cannot promise' },
  { re: /\baccurate(ly)?\b/i, why: 'claims accuracy that cannot be substantiated' },
  { re: /\bscientific(ally)?\b/i, why: 'claims scientific standing' },
  { re: /\btestimonial/i, why: 'PRD §2 rules out testimonials until real ones exist' },
  { re: /\bdiagnos(is|tic|e|ing)\b/i, why: 'reads as a clinical claim' },
]

/**
 * Sanctioned uses, each because the sentence is refusing the claim rather
 * than making it. Exact matches, so a reworded sentence has to be looked at
 * again.
 */
const ALLOWED = new Set([
  'Is this scientific?',
  'Is this a diagnosis of any kind?',
  'Insights are indicative and growth-oriented — never diagnostic.',
  'No, and we would rather say so plainly. Graphology is not an established science and this is not a psychological or medical assessment. What it offers is a structured, consistent reading of your writing, framed as something to reflect on. Everything in your report is written as an indication, never as a fact about you.',
  'No. Nothing here identifies a condition, and nothing here should be used in place of advice from a doctor, therapist or counsellor. If a report ever reads like it is doing that, we have written it badly.',

  // The terms, where the two words appear inside a denial and a disclaimer —
  // "is not a diagnosis", "availability is not guaranteed". Refusing a claim
  // is the opposite of making one.
  'Graphology is not an established science. Nothing in your report is a fact about you, a diagnosis, or a prediction, and nothing in it should be used in place of advice from a doctor, therapist, counsellor or lawyer. Every reading is written as an indication, and you are free to disagree with it.',
  'This is a pilot run by one person. Availability is not guaranteed, orders may be paused when the queue is full, and the service may change or stop. If it stops while you are waiting on a report, you will be told and refunded.',
])

/** Comments are where this rule gets explained, so they are not copy. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/**
 * Does this string look like prose a person reads, rather than an import
 * path, a CSS custom property or a list of Tailwind classes?
 *
 * Prose has spaces, and it has either a capital letter or sentence
 * punctuation. Tailwind class lists have spaces but neither. Paths and
 * identifiers have no spaces at all. Crude, and it is the difference between
 * a guard that names two real problems and one that names twenty-five
 * imaginary ones.
 *
 * The cost is one-word copy going unchecked. Every banned term here appears
 * in sentences, so that trade is worth making to keep the signal clean.
 */
function looksLikeProse(value) {
  const v = value.trim()
  if (/^[.@/#]|^--/.test(v)) return false
  if (!/\s/.test(v)) return false
  return /[.?!]/.test(v) || /[A-Z]/.test(v)
}

/** What a reader reads: string literals, and text between JSX tags. */
function readableStrings(source) {
  const code = stripComments(source)
  const found = []

  for (const m of code.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const value = m[1] ?? m[2] ?? m[3] ?? ''
    if (looksLikeProse(value)) found.push({ value, index: m.index ?? 0 })
  }

  // JSX text: between a closing '>' and the next '<', ignoring expressions.
  for (const m of code.matchAll(/>([^<>{}]+)</g)) {
    const value = (m[1] ?? '').replace(/\s+/g, ' ').trim()
    if (looksLikeProse(value)) found.push({ value, index: m.index ?? 0 })
  }

  return { code, found }
}

function lineOf(code, index) {
  return code.slice(0, index).split('\n').length
}

function walk(dir) {
  let out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out = out.concat(walk(path))
    else if (/\.(ts|tsx|md)$/.test(path)) out.push(path)
  }
  return out
}

const offences = []

for (const rel of SCANNED) {
  let files
  try {
    files = walk(join(ROOT, rel))
  } catch {
    continue // Section not built yet.
  }

  for (const file of files) {
    const { code, found } = readableStrings(readFileSync(file, 'utf8'))

    for (const { value, index } of found) {
      if (ALLOWED.has(value.trim())) continue

      for (const { re, why } of BANNED) {
        const match = re.exec(value)
        if (!match) continue

        offences.push({
          file: file.replace(ROOT, ''),
          line: lineOf(code, index),
          phrase: match[0],
          why,
          text: value.trim().slice(0, 110),
        })
      }
    }
  }
}

if (offences.length > 0) {
  console.error('\nClaims guard: copy that promises more than Tegaki can deliver.\n')
  for (const o of offences) {
    console.error(`  ${o.file}:${o.line}  "${o.phrase}" — ${o.why}`)
    console.error(`    ${o.text}\n`)
  }
  console.error(`${offences.length} problem(s). Solution-PRD §2: indicative, never diagnostic.\n`)
  process.exit(1)
}

console.log(`Claims guard: clean.`)
