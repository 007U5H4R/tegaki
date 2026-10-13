---
id: TASK-10
title: Rewrite one section with a note
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:3'
milestone: m-1
dependencies:
  - TASK-9
priority: medium
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
'Rewrite…' on a section opens a note field, shows the estimated cost, and asks Sonnet to rewrite only that section, saving the result as a new version.

Tegaki Machine TKT-08. Related EVAL: EVAL-011. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Only the chosen section changes; the others are byte-identical
- [ ] #2 The cost estimate is shown before the call and counted against the cap
- [ ] #3 Checks re-run on the result
<!-- AC:END -->
