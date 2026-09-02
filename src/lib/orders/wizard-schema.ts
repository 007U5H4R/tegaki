import { z } from 'zod'

/**
 * Wizard stage 1 — Solution-PRD §6.3.
 *
 * One schema, used by the browser for inline errors and by the server action
 * as the authority. A client-only check is a courtesy, not a rule: anything
 * that must hold is re-validated on the server and, for consent, in the
 * database as well.
 *
 * Messages are written to be read by the person filling the form, so they
 * say what to do rather than which field failed which predicate.
 */

const trimmed = (max: number) => z.string().trim().max(max)

const requiredText = (label: string, max = 120) =>
  trimmed(max).min(1, { message: `Please enter ${label}.` })

const age = z.coerce
  .number({ message: 'Please enter an age in years.' })
  .int({ message: 'Please enter an age in whole years.' })
  .min(5, { message: 'We can only assess handwriting from age 5 upwards.' })
  .max(120, { message: 'Please check that age.' })

export const stage1Schema = z
  .object({
    fullName: requiredText('your full name'),
    age,
    // Free text rather than a fixed list: it only shapes the report's
    // pronouns, and a short list would exclude people for no benefit.
    gender: trimmed(60).optional().or(z.literal('')),
    city: requiredText('your city'),
    country: requiredText('your country'),

    email: trimmed(200)
      .min(1, { message: 'Please enter an email address.' })
      .pipe(z.email({ message: 'That does not look like an email address.' })),

    // Deliberately loose: Indian mobile numbers get written with +91, with a
    // leading 0, with spaces and with dashes, and all of them are correct.
    phone: trimmed(20)
      .min(7, { message: 'Please enter a phone number we can reach you on.' })
      .regex(/^[0-9+\-\s()]+$/, { message: 'Please use only digits, spaces, + and -.' }),

    whatsappPreferred: z.boolean().default(false),

    subjectIsSelf: z.boolean(),
    subjectName: trimmed(120).optional().or(z.literal('')),
    subjectAge: z.union([age, z.literal('')]).optional(),
    consent: z.boolean().default(false),
  })
  .superRefine((values, ctx) => {
    if (values.subjectIsSelf) return

    if (!values.subjectName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['subjectName'],
        message: 'Please enter the name of the person whose handwriting this is.',
      })
    }

    if (values.subjectAge === '' || values.subjectAge === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['subjectAge'],
        message: 'Please enter their age.',
      })
    }

    if (!values.consent) {
      ctx.addIssue({
        code: 'custom',
        path: ['consent'],
        // Says why, not just that it is required. The rule exists to protect
        // the person being written about, who is not in the room.
        message:
          "Please confirm you have this person's permission. We will not analyse someone's handwriting without it.",
      })
    }
  })

export type Stage1Values = z.infer<typeof stage1Schema>

/** Field-keyed errors, ready to hand to the form. */
export type Stage1Errors = Partial<Record<keyof Stage1Values, string>>

export function collectErrors(error: z.ZodError): Stage1Errors {
  const out: Stage1Errors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in out)) {
      out[key as keyof Stage1Values] = issue.message
    }
  }
  return out
}
