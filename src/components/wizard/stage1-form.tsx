'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Toggle } from '@/components/ui/checkbox'
import { Field, Input } from '@/components/ui/field'
import { saveStage1, type Stage1State } from '@/lib/orders/stage1-action'
import { cn } from '@/lib/cn'

export type Stage1Defaults = {
  fullName?: string | null
  age?: number | null
  gender?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
  whatsappPreferred?: boolean | null
  subjectIsSelf?: boolean | null
  subjectName?: string | null
  subjectAge?: number | null
  consentGivenAt?: string | null
}

export function Stage1Form({ orderId, defaults }: { orderId: string; defaults: Stage1Defaults }) {
  const [state, formAction, pending] = useActionState<Stage1State, FormData>(
    saveStage1.bind(null, orderId),
    {},
  )

  const [isSelf, setIsSelf] = useState(defaults.subjectIsSelf ?? true)
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <h1 className="text-washi-50 font-serif text-3xl">About you</h1>

        <Field label="Full name" required error={errors.fullName}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="fullName"
              defaultValue={defaults.fullName ?? ''}
              invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="name"
            />
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Age" required error={errors.age}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="age"
                type="number"
                inputMode="numeric"
                defaultValue={defaults.age ?? ''}
                invalid={invalid}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field
            label="Gender"
            hint="Used only so your report reads naturally — never as part of the analysis."
            error={errors.gender}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="gender"
                defaultValue={defaults.gender ?? ''}
                invalid={invalid}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="City" required error={errors.city}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="city"
                defaultValue={defaults.city ?? ''}
                invalid={invalid}
                aria-describedby={describedBy}
                autoComplete="address-level2"
              />
            )}
          </Field>

          <Field label="Country" required error={errors.country}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="country"
                defaultValue={defaults.country ?? 'India'}
                invalid={invalid}
                aria-describedby={describedBy}
                autoComplete="country-name"
              />
            )}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-washi-50 font-serif text-2xl">How we reach you</h2>

        <Field label="Email" required hint="Where your report link is sent." error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              defaultValue={defaults.email ?? ''}
              invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="email"
            />
          )}
        </Field>

        <Field label="Phone" required error={errors.phone}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaults.phone ?? ''}
              invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="tel"
            />
          )}
        </Field>

        <Toggle
          name="whatsappPreferred"
          label="Send my report on WhatsApp as well"
          defaultChecked={defaults.whatsappPreferred ?? false}
        />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-washi-50 font-serif text-2xl">Whose handwriting is this?</h2>

        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Who this is for">
          <SubjectChoice
            name="subjectIsSelf"
            value="self"
            checked={isSelf}
            onSelect={() => setIsSelf(true)}
            title="My own"
            body="You are submitting your own handwriting."
          />
          <SubjectChoice
            name="subjectIsSelf"
            value="other"
            checked={!isSelf}
            onSelect={() => setIsSelf(false)}
            title="Someone else's"
            body="A partner, child, colleague or friend."
          />
        </div>

        {!isSelf ? (
          <Card className="border-shu-900 bg-shu-900/20 flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Their name" required error={errors.subjectName}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    name="subjectName"
                    defaultValue={defaults.subjectName ?? ''}
                    invalid={invalid}
                    aria-describedby={describedBy}
                  />
                )}
              </Field>

              <Field label="Their age" required error={errors.subjectAge}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    name="subjectAge"
                    type="number"
                    inputMode="numeric"
                    defaultValue={defaults.subjectAge ?? ''}
                    invalid={invalid}
                    aria-describedby={describedBy}
                  />
                )}
              </Field>
            </div>

            <Checkbox
              name="consent"
              defaultChecked={Boolean(defaults.consentGivenAt)}
              error={errors.consent}
              label={
                <>
                  I have this person&rsquo;s permission to have their handwriting analysed.
                  <span className="text-washi-300 mt-1 block text-sm">
                    They have not agreed to anything by being written about, so we ask you to
                    confirm on their behalf.
                  </span>
                </>
              }
            />
          </Card>
        ) : null}
      </section>

      {state.formError ? (
        <p
          role="alert"
          className="border-err-500/40 bg-err-500/10 text-washi-50 rounded-lg border px-4 py-3 text-sm"
        >
          {state.formError}
        </p>
      ) : null}

      <div>
        <Button type="submit" loading={pending} className="w-full sm:w-auto">
          Continue to your sample
        </Button>
      </div>
    </form>
  )
}

function SubjectChoice({
  name,
  value,
  checked,
  onSelect,
  title,
  body,
}: {
  name: string
  value: string
  checked: boolean
  onSelect: () => void
  title: string
  body: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-1 rounded-2xl border p-4',
        'duration-press transition-[border-color,background-color] ease-out',
        checked ? 'border-shu-500 bg-shu-900/30' : 'border-ink-700 hover:border-ink-500',
        'has-[:focus-visible]:outline-shu-500 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="text-washi-50 font-medium">{title}</span>
      <span className="text-washi-300 text-sm">{body}</span>
    </label>
  )
}
