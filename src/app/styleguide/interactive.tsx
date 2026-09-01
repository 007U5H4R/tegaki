'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox, Toggle } from '@/components/ui/checkbox'
import { Dropzone, FileRow } from '@/components/ui/dropzone'
import { Field, Input, Textarea } from '@/components/ui/field'
import { MicroLabel } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/states'

/**
 * The parts of the styleguide that need state. Kept in one client component so
 * the page itself stays a server component and the specimens are genuinely
 * interactive — a state you cannot click is a screenshot, not a test.
 */

function Buttons() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <Row label="Primary">
        <Button>Begin your assessment</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true)
            setTimeout(() => setLoading(false), 1600)
          }}
        >
          Click to load
        </Button>
      </Row>

      <Row label="Ghost">
        <Button variant="ghost">See a sample report</Button>
        <Button variant="ghost" size="sm">
          Small
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
      </Row>

      <Row label="Quiet">
        <Button variant="quiet">Cancel</Button>
        <Button variant="quiet" size="sm">
          Remove
        </Button>
      </Row>

      <p className="text-washi-300 max-w-[560px] text-sm">
        Press any of them: the 0.97 scale on <code className="font-mono text-xs">:active</code> is
        what makes a button feel like it heard you. Hover effects are gated to fine pointers, so a
        tap on a phone does not leave a button stuck looking hovered.
      </p>
    </div>
  )
}

function Fields() {
  const [consent, setConsent] = useState(false)
  const [whatsapp, setWhatsapp] = useState(true)
  const [email, setEmail] = useState('not-an-email')

  const emailError = email.includes('@') ? undefined : 'Enter an email address we can reach you at.'

  return (
    <div className="flex max-w-md flex-col gap-6">
      <Field label="Full name" required>
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            placeholder="As it should appear on the report"
          />
        )}
      </Field>

      <Field label="Email" required hint="Where your report link is sent." error={emailError}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="email"
            value={email}
            invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>

      <Field label="Anything we should know" hint="Optional context about the sample.">
        {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} />}
      </Field>

      <Checkbox
        label="I confirm I have this person's consent to analyse their handwriting."
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        error={consent ? undefined : 'Required when the analysis is for someone else.'}
      />

      <Toggle
        label="Send my report on WhatsApp too"
        checked={whatsapp}
        onChange={(e) => setWhatsapp(e.target.checked)}
      />
    </div>
  )
}

function Upload() {
  const [locked, setLocked] = useState(true)

  return (
    <div className="flex flex-col gap-6">
      <Toggle
        label="Guardrails checklist complete (unlocks the dropzone)"
        checked={!locked}
        onChange={(e) => setLocked(!e.target.checked)}
      />

      <Dropzone
        disabled={locked}
        disabledReason="Tick the four sample guidelines above before uploading."
      />

      <div className="flex flex-col gap-3">
        <MicroLabel tone="muted">File rows</MicroLabel>
        <FileRow
          name="handwriting-page-1.jpg"
          size={2_340_000}
          state={{ kind: 'done' }}
          onRemove={() => {}}
        />
        <FileRow
          name="handwriting-page-2.jpg"
          size={3_120_000}
          state={{ kind: 'uploading', progress: 62 }}
        />
        <FileRow
          name="signatures.pdf"
          size={24_800_000}
          state={{
            kind: 'error',
            message: 'That file is over the 20 MB limit. Try a smaller photo.',
          }}
          onRemove={() => {}}
          onRetry={() => {}}
        />
      </div>
    </div>
  )
}

function ErrorSpecimen() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      <ErrorState
        message="We could not load your assessments."
        onRetry={() => setCount((c) => c + 1)}
      />
      <p className="text-ink-500 font-mono text-xs">
        retry pressed {count} {count === 1 ? 'time' : 'times'} — the handler is real, not decorative
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <MicroLabel tone="muted">{label}</MicroLabel>
      <div className="mt-3 flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}

/**
 * Exported individually rather than bundled into an object. Next registers
 * each named export of a 'use client' module as its own client reference; an
 * object literal is not traversed, so a server component destructuring it
 * receives undefined and the page fails to prerender.
 */
export { Buttons, ErrorSpecimen, Fields, Upload }
