---
id: TASK-22.1
title: Add a Supabase keep-alive and find why it paused
status: In Progress
assignee: []
created_date: '2026-10-14 12:45'
updated_date: '2026-10-14 14:37'
labels:
  - P1
  - payments-v1.1
  - ready-for-agent
milestone: m-4
dependencies: []
references:
  - tickets.md
parent_task_id: TASK-22
priority: high
type: task
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Supabase paused silently on 2026-10-13 and broke sign-in (tickets.md T24)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T24-keepalive-rca.md (technical-plan.md §3.1–3.2, TP7). RCA evidence first; keep-alive WRITES a heartbeat row; stale-heartbeat panel in admin. Tests: TC-P01–P07.
<!-- SECTION:PLAN:END -->
