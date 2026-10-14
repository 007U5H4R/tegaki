---
id: TASK-22.2
title: Serve Tegaki at tegaki.tusharpathak.com
status: To Do
assignee: []
created_date: '2026-10-14 12:45'
updated_date: '2026-10-14 14:10'
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
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trust at payment time; redirect the old vercel.app URL (tickets.md T25)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T25-domain-move.md (technical-plan.md §3.3, §9.2, TP8). Google redirect URI unchanged; Supabase Site URL + allow-list; regenerate OG image (old host printed in it). Tests: TC-P08–P10.
<!-- SECTION:PLAN:END -->
