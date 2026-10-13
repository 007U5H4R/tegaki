---
id: TASK-14
title: Deliver the report to the order with timed release
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-2
dependencies:
  - TASK-6
  - TASK-13
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Approving the report for an order-sourced client attaches the PDF to that Tegaki order with release_at = sample approval + 3/5/7 days (or now if that has passed). The client sees it in their dashboard only from release_at; reports that already exist stay visible.

Tegaki Machine TKT-12. Related EVAL: EVAL-021, EVAL-022, EVAL-034. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Access test: a client is denied 1 minute before release_at and allowed 1 minute after
- [ ] #2 Every pre-existing delivered report (release_at null) stays visible to its owner
- [ ] #3 release_at is computed in the database, exactly per tier
- [ ] #4 The Files screen shows the release date in words
<!-- AC:END -->
