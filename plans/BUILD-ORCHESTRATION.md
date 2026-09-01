# Tegaki — Build Orchestration Playbook

> How the subagent build actually runs. Read together with `tickets.md` (the DAG) and `plans/T*.md` (the briefs). At build kickoff, also load the `orchestration-playbook` skill — where it and this file disagree, the skill's process rules win; this file carries the Tegaki-specific decisions.

## 1. Workspace & ledger

- **Git first:** T01/A1–A2 run in the main checkout (they create the repo). Immediately after, create the build branch `build/pilot` and work there — `main` stays clean; merge happens only after the stage-7 review gate.
- **Ledger:** `plans/LEDGER.md` — one line per plan task (`T03/A2 · done · <commit> · <note>`), updated by the orchestrator after every task review. The ledger is the crash-recovery state: any fresh session resumes from it.
- Briefs and reports pass **as files** (`plans/T*.md` in, `plans/reports/T*-report.md` out) — never pasted history.

## 2. Dispatch model

- **One fresh implementer subagent per ticket**, executing its plan's tasks **in order** with TDD (red → green → refactor) per task; the plan's per-task gates are its checklist. (Tickets are context-window-sized precisely so one implementer can own one ticket.)
- **No parallel implementers on shared files.** Safe parallel pairs when both blockers are done: T05 ∥ T04 (touching different routes; the T04 demo route avoids the shell), T09 ∥ T10, T13 ∥ T12. When in doubt, serialize.
- Content tickets (C1–C4) run in this orchestrator session directly (they're judgment + MCP work, not codebase work).

## 3. Reviews & fix loop (per ticket)

1. **Spec review** — a reviewer subagent checks the diff against the ticket + plan (acceptance criteria, standing gates, nothing extra built). 
2. **Quality review** — clean-code pass (naming, dead code, test honesty — a test that can't fail is a finding).
3. **Fix loop** — bounded at 5 rounds: rounds 1–3 resume the implementer; 4–5 escalate to the most capable model; at the breaker, park with a written reason and surface to Tushar.

## 4. QA gates (phase boundaries — a fresh QA-tester subagent each time)

| After | The QA agent proves |
|---|---|
| Phase 1 (T01–T02) | Live sign-in on the deployed URL; styleguide states; RLS suite green |
| Phase 2 (T03–T06) | **A stranger's account completes sign-in → submitted order on the deployed URL**; cross-account isolation re-run |
| Phase 3 (T07–T10) | Full fulfillment: approve → report upload → download → delivered; reject → re-upload loop; pause switch; all as both admin and buyer |
| Phase 4 (T11–T14) | Landing gates: Lighthouse ≥85 mobile, unfurl evidence, scrub + all fallbacks, claims grep |
| Phase 5 (T15) | Retention boundaries + purge, live cron run evidence |

QA writes its cases to `plans/qa/phase-N.md` (derived from PRD acceptance criteria + prior phases as regressions) **before** executing them; failures feed the fix loop; the phase is not done until its cases pass. Cases accumulate into the regression suite for later phases.

## 5. Model assignment

| Role | Model | Why |
|---|---|---|
| Orchestrator (this session) | Opus high | Judgment, reviews, content tickets |
| Implementers (T01–T15) | **Sonnet, high effort** (`Agent` tool `model: "sonnet"`) | Plans are explicit enough that Sonnet executes them well at a fraction of the cost |
| Design-judgment tickets (T02, T11, T14) implementer | Opus | Token-fidelity and motion feel need taste |
| Spec/quality reviewers | Opus | Reviews are where capability pays |
| QA-tester agents | Sonnet high | Test design from written criteria |
| Final whole-branch review | The most capable available (this session's model) | The last gate before merge |

Name the model on every dispatch in the ledger. (Per-dispatch tiering works via the Agent tool's `model` parameter in this session.)

## 6. Budget & session discipline (Pro tier)

- **Stop at phase boundaries, not mid-ticket.** Each phase is a natural session break; a fresh session resumes from `tegaki-handoff.md` + `plans/LEDGER.md`.
- Prefer build/console/test verification; screenshots only where a gate demands visual evidence (T11/T13/T14).
- Higgsfield balance after C5: **~89 credits** — reserved for C4's gallery (~16–32) unless Tushar photographs real examples instead.

## 7. Human-in-the-loop points (never faked, never stubbed)

- T01 H1–H4: Supabase project · Google OAuth client · GitHub/Vercel link · admin email.
- T13: Tushar's WhatsApp number for contact links; unfurl verification needs a real WhatsApp paste.
- T12: real photo or explicit OK on the placeholder; credential claims confirmed in writing.
- C1/C3: Tushar approves prompt variants and fictional samples.
- Phase-4 look-check: Tushar eyeballs the landing + scrub on his own phone before phase close.
- Every phase boundary: present, get approval, confirm model/effort for the next phase.

## 8. Completion

Final whole-branch review (most capable model) → single fix wave → all suites green → **stage 7 reviews**: `/code-review`, `/security-review`, `/impeccable` → triage/fix/re-run until clean → `finishing-a-development-branch`: merge/PR/keep per Tushar → pilot live checklist (deploy verified, unfurl re-scraped, admin walkthrough with Tushar).
