---
id: TASK-17
title: Render another tier and the trimming loop
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:3'
milestone: m-3
dependencies:
  - TASK-6
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From Files, Tushar renders any other tier from the same approved draft with no AI cost. An over-budget render shows 'Needs trimming' with the page count and links back to review.

Tegaki Machine TKT-15. Related EVAL: EVAL-035, EVAL-033. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rendering another tier makes 0 AI calls
- [ ] #2 A needs_trimming render links back to the review with the overage named
<!-- AC:END -->
