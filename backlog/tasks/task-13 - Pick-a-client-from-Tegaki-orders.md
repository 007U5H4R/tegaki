---
id: TASK-13
title: Pick a client from Tegaki orders
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-2
dependencies:
  - TASK-4
  - TASK-12
priority: high
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On New report, Tushar searches Tegaki orders by client name, sees matches (name, order date, tier, sample status), picks one, and its latest sample set is copied into Tegaki Machine with the name, tier and pronouns prefilled for confirmation.

Tegaki Machine TKT-11. Related EVAL: EVAL-020. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Search matches subject names and, for self-orders, the buyer's name
- [ ] #2 Only the latest sample version is copied; copies are kept indefinitely (S6)
- [ ] #3 Pronouns are prefilled from the client's stated gender and still need confirming
- [ ] #4 Non-admins can't reach the search or copy endpoints
<!-- AC:END -->
