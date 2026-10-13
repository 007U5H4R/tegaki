---
id: TASK-15
title: Signature sections across tiers
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:5'
milestone: m-3
dependencies:
  - TASK-3
  - TASK-7
priority: medium
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a signature photo is supplied, the draft includes the tier's signature section (Express: a note on the signature; Core: signature vs everyday writing; Comprehensive: how the signature reads in public). Without a signature, no such section or claim exists.

Tegaki Machine TKT-13. Related EVAL: EVAL-002, EVAL-015. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The signature section renders in each tier within its page budget
- [ ] #2 With no signature, the signature check passes and no signature text exists
- [ ] #3 The signature reading cites the signature image only
<!-- AC:END -->
