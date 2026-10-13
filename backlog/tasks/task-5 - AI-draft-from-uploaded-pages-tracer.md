---
id: TASK-5
title: AI draft from uploaded pages (tracer)
status: In Progress
assignee: []
created_date: '2026-10-13 13:03'
updated_date: '2026-10-13 14:05'
labels:
  - P1
  - tegaki-machine
  - 'sp:8'
milestone: m-0
dependencies:
  - TASK-4
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pressing 'Analyse handwriting' runs the Opus 5.5 read (observations, scores, type, archetype) and then the Sonnet 5.5 write (all 16 sections + Express extras) in the background. The Drafting screen shows the real steps, elapsed time and cost; closing the app is safe; the finished draft is shown raw.

Tegaki Machine TKT-03. Related EVAL: EVAL-011, EVAL-012, EVAL-013. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The draft is saved as a schema-validated version; malformed output is retried once with the error, then failed visibly
- [ ] #2 Cost is checked against ₹50 before every call; exceeding it stops the run as over_budget
- [ ] #3 Progress comes from machine_events and survives closing and reopening the app
- [ ] #4 Each section records the observations (and pages) it relies on
- [ ] #5 Unit tests cover the cost-cap maths and schema validation; the AI is mocked in tests
<!-- AC:END -->
