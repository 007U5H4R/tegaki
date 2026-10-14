---
id: TASK-22.3
title: Build the UPI pay screen behind PAYMENTS_MODE
status: To Do
assignee: []
created_date: '2026-10-14 12:45'
updated_date: '2026-10-14 14:10'
labels:
  - P1
  - payments-v1.1
  - ready-for-agent
milestone: m-5
dependencies: []
references:
  - tickets.md
parent_task_id: TASK-22
priority: high
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Riskiest slice: per-order QR and app link from server price (tickets.md T16)
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See plans/T16-upi-pay-screen.md (technical-plan.md §2.1, §2.6, §9.3; TP1, TP3, TP4, TP11). CHANGE: payments_mode lives in DB settings, not env (TP1). Opens with a real-device payment spike (S0) before any UI. Tests: TC-P11–P21.
<!-- SECTION:PLAN:END -->
