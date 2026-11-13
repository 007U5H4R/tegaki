# Lessons learnt: Graphology / Tegaki

> The repo is public, so this draft leaves out client names, payment identifiers, contact details and secrets. (HANDOFF:28)
> Sources: repo commits and `HANDOFF.md`.

## Lessons

### L1 — A cron job reported success while every delete failed
- **Situation:** The cleanup cron returned 200 even when storage refused every delete. Vercel's monitor reads only the status code. (d70f3a6)
- **Decision/Outcome:** The cron now returns 500 when deletes fail. (d70f3a6)
- **Lesson → Future Rule:** **Future Rule:** a job's exit status must reflect partial and total failure, because monitors only see that status.

### L2 — A silent fallback broke sign-in
- **Situation:** `requestOrigin()` fell through to the literal `https://null`, so Google sign-in failed without any error. (d70f3a6)
- **Decision/Outcome:** It now throws a named error. (d70f3a6)
- **Lesson → Future Rule:** **Future Rule:** missing configuration should throw a named error, never fall back to a placeholder value.

### L3 — NULL is not false in access checks
- **Situation:** A setting was NULL rather than false, so `if not allowed` never fired. `order_files` also had a table-wide INSERT grant. (fc157d5)
- **Decision/Outcome:** The check now uses coalesce. The INSERT grant is restricted to specific columns, with a path policy. (fc157d5)
- **Lesson → Future Rule:** **Future Rule:** coalesce nullable flags in security checks, and grant column-level privileges, not table-wide ones.

### L4 — A column grant let a buyer bypass the submit procedure
- **Situation:** INSERT on `orders` was granted on every column, so a buyer could skip `submit_order()`. (aae551e)
- **Decision/Outcome:** It is now restricted to `buyer_id`. (aae551e)
- **Lesson → Future Rule:** **Future Rule:** when a stored procedure is the intended write path, revoke direct writes to the columns it controls.

### L5 — A missing ON DELETE rule blocked account deletion
- **Situation:** `order_files.uploader_id` had no ON DELETE rule, so account deletion failed with "Database error deleting user". (a7b9e12)
- **Decision/Outcome:** The foreign key rule was added, and 21 leftover test accounts were cleaned up. (a7b9e12)
- **Lesson → Future Rule:** **Future Rule:** every foreign key to a user table declares its ON DELETE behaviour. Test account deletion end to end.

### L6 — The accessibility gate overrides the design spec
- **Situation:** In Lighthouse a11y, a tagline muted to 30% fell below 3:1 contrast. The label of the nav lockup didn't match its content, which failed WCAG 2.5.3. (4cdbd61)
- **Decision/Outcome:** The gate's threshold took precedence over the Design.md value, and both issues were fixed. (4cdbd61)
- **Lesson → Future Rule:** **Future Rule:** when a design token fails a contrast or label check, the accessibility gate wins and the Design.md is updated.

### L7 — Throwaway test credentials are generated per run
- **Situation:** The test passwords were static. (65e2675)
- **Decision/Outcome:** They are now generated for each run. (65e2675)
- **Lesson → Future Rule:** **Future Rule:** generate test credentials per run. Never commit them.

### L8 — The free database tier paused silently
- **Situation:** Supabase paused silently on 2026-10-13. (406c1dc, HANDOFF S7)
- **Decision/Outcome:** A daily DB heartbeat was added. (406c1dc)
- **Lesson → Future Rule:** **Future Rule:** any free tier that pauses when idle needs a heartbeat and an alert.

### L9 — Logs are only kept for a short time
- **Situation:** Vercel Hobby keeps logs for only 1 hour. (HANDOFF:30)
- **Decision/Outcome:** This was recorded as an operational constraint. (HANDOFF:30)
- **Lesson → Future Rule:** **Future Rule:** if log retention is short, send failures somewhere durable (alerts or a drain), or incidents can't be investigated.

### L10 — A public repo needs content hygiene
- **Situation:** The repo is public. (HANDOFF:28)
- **Decision/Outcome:** Client names, payment IDs and secrets are never committed. (HANDOFF:28)
- **Lesson → Future Rule:** **Future Rule:** scan for personal data and secrets before every push to a public repo.

## Reusable Rules for Future Projects
- Exit codes and status codes must reflect failure (L1, L2).
- The database enforces access: coalesce nulls, use column-level grants, write through procedures (L3, L4).
- Every foreign key declares its ON DELETE behaviour (L5).
- Free tiers that pause need a heartbeat (L8).

## Candidate Global CLAUDE.md Improvements
- "Make failure observable" could say outright that a job returning 2xx on partial failure is invisible to monitors (L1).
