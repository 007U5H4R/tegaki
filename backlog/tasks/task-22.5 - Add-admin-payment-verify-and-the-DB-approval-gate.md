---
id: TASK-22.5
title: Add admin payment verify and the DB approval gate
status: To Do
assignee: []
created_date: '2026-10-14 12:45'
updated_date: '2026-10-14 14:10'
labels:
  - P1
  - payments-v1.1
  - ready-for-agent
milestone: m-5
dependencies:
  - TASK-22.4
references:
  - tickets.md
parent_task_id: TASK-22
priority: high
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No unpaid work can start; demo_paid still passes (tickets.md T18)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T18-admin-verify-gate.md (technical-plan.md §2.4). Gate in transition_order, refuses service role too; demo_paid passes. Adds order-code search. Tests: TC-P27–P31.
<!-- SECTION:PLAN:END -->
