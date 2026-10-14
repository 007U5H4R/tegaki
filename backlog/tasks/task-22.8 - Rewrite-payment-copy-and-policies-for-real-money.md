---
id: TASK-22.8
title: Rewrite payment copy and policies for real money
status: To Do
assignee: []
created_date: '2026-10-14 12:46'
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
type: docs
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No demo-payment wording once live (tickets.md T21)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T21-copy-policies.md. Copy chosen by payments_mode; policy pages revalidate 300s; payments_mode() granted to anon. Tests: TC-P38–P39.
<!-- SECTION:PLAN:END -->
