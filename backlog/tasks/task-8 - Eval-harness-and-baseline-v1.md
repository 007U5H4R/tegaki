---
id: TASK-8
title: Eval harness and baseline-v1
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-1
dependencies:
  - TASK-7
priority: high
type: task
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One command runs the evaluation dataset through the real pipeline (3 runs per client), scores it with the shared checks and the Opus judge rubric, and stores baseline-v1 with full provenance; Tushar's ratings calibrate the judge.

Tegaki Machine TKT-06. Related EVAL: EVAL-006, EVAL-007, EVAL-008, EVAL-009, EVAL-010, EVAL-014, EVAL-016, EVAL-017. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `pnpm eval:machine` produces evals/results/baseline-v1.json from real output (never hand-entered)
- [ ] #2 Provenance recorded: git commit, models, prompt version, dataset version, timestamp
- [ ] #3 Judge agreement with Tushar's pass/fail is computed; below 80% marks the judge advisory
- [ ] #4 SYN-INJECT and SYN-UNUSABLE cases run and are scored
<!-- AC:END -->
