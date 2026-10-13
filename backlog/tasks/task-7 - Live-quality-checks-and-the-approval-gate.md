---
id: TASK-7
title: Live quality checks and the approval gate
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-1
dependencies:
  - TASK-5
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every draft is checked for pronoun consistency, signature claims without a signature, diagnostic language, structure and internal consistency. Failing checks are listed and link to the section, and Approve stays disabled with the reason shown.

Tegaki Machine TKT-05. Related EVAL: EVAL-001, EVAL-002, EVAL-003, EVAL-004, EVAL-005. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The checks are one shared module used by both the app and the eval scorers
- [ ] #2 Each check has unit tests with passing and failing fixtures
- [ ] #3 Approve is disabled while any check fails, with the reason linked to the button (aria-describedby)
- [ ] #4 On phone, a failing-check summary appears at the top of the review
<!-- AC:END -->
