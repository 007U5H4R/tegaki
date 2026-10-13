---
id: TASK-9
title: Review editor with autosaved versions
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:8'
milestone: m-1
dependencies:
  - TASK-7
priority: high
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Review screen shows the draft as the raised sheet with evidence chips per section, and a rail with checks and the editable profile (type, leanings, archetype, 12 score steppers). Every edit autosaves into a new version; versions can be switched and compared.

Tegaki Machine TKT-07. Related EVAL: EVAL-005. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Editing any section, score, type or archetype autosaves and re-runs the checks
- [ ] #2 Version pills switch versions; Compare shows changed sections side by side
- [ ] #3 Layout matches the frozen Design.md and mockup at 375 / 768 / 1280 with no horizontal overflow
- [ ] #4 Keyboard order follows visual order; steppers and buttons meet the target sizes
<!-- AC:END -->
