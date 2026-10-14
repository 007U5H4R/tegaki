---
id: TASK-22.10
title: Walk through payments on a phone and switch to live
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
  - TASK-22.3
  - TASK-22.4
  - TASK-22.5
  - TASK-22.6
  - TASK-22.7
  - TASK-22.8
  - TASK-22.9
  - TASK-22.1
  - TASK-22.2
references:
  - tickets.md
parent_task_id: TASK-22
priority: high
type: task
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Release: flip PAYMENTS_MODE to live, remove demo code (tickets.md T23)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T23-release-walkthrough.md (TP10). REQUIRE_DB_TESTS=1 release run; walk-through in admin_preview; flip on /admin/settings; demo removal in a later PR. Tests: TC-P43–P45.
<!-- SECTION:PLAN:END -->
