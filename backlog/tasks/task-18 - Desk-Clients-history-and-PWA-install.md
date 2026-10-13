---
id: TASK-18
title: 'Desk, Clients history and PWA install'
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:5'
milestone: m-3
dependencies:
  - TASK-6
priority: medium
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The task-first Desk (Needs you / In progress / Releasing), the Clients list with search, versions and costs, the Mac 'last seen' status, all four screen states, and installing as 'Tegaki Machine' from /machine with a manifest and service worker scoped to /machine.

Tegaki Machine TKT-16. Related EVAL: design gates. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Desk and Clients have loading, empty, error and working states per Design.md §18
- [ ] #2 The PWA manifest and service worker are scoped to /machine; the public site's behaviour is unchanged
- [ ] #3 Phone layout: the bottom tab bar, and the action bar above it; no horizontal overflow at 375 / 768 / 1280
<!-- AC:END -->
