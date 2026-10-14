---
id: TASK-22.6
title: 'Handle payment not found, re-attach and parking'
status: To Do
assignee: []
created_date: '2026-10-14 12:45'
updated_date: '2026-10-14 14:10'
labels:
  - P2
  - payments-v1.1
  - ready-for-agent
milestone: m-5
dependencies:
  - TASK-22.5
references:
  - tickets.md
parent_task_id: TASK-22
priority: medium
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Customer sees the reason and can fix it (tickets.md T19)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T19-not-found-reattach-park.md (TP9). New edge sample_under_review→parked; payment_park_days()=14. Tests: TC-P32–P35.
<!-- SECTION:PLAN:END -->
