---
id: TASK-11
title: Redo analysis and Resume
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:5'
milestone: m-1
dependencies:
  - TASK-5
  - TASK-9
priority: medium
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
'Redo analysis' starts a fresh full run as a new draft version, with an optional steering note; earlier versions stay. 'Resume' continues a failed run from its last completed step without paying for that step again.

Tegaki Machine TKT-09. Related EVAL: EVAL-030. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Resume after a Step B failure makes 0 repeat paid calls for Step A
- [ ] #2 Redo creates a new version and leaves approved or released reports untouched until it is approved
- [ ] #3 The client page shows cost per run and in total
<!-- AC:END -->
