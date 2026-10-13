---
id: TASK-6
title: 'Approve, render on the Mac, download (tracer)'
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P1
  - tegaki-machine
  - 'sp:8'
milestone: m-0
dependencies:
  - TASK-3
  - TASK-5
priority: high
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Approving a draft queues a render. The Mac worker claims it with its own single-purpose token, renders it with Word, checks the page budget and uploads the PDF and .docx, which Tushar downloads from the app. This completes the end-to-end tracer bullet.

Tegaki Machine TKT-04. Related EVAL: EVAL-023, EVAL-031, EVAL-032, EVAL-033, EVAL-037. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The worker token can claim a job and upload its files, and nothing else (no reads of other clients or samples)
- [ ] #2 Two workers racing for one job produce exactly one render (atomic claim + 10-minute lease)
- [ ] #3 A Word hang is killed at 3 minutes, marked render_failed with the reason, and the worker recovers
- [ ] #4 An over-budget render is marked needs_trimming and is never offered as final
- [ ] #5 The worker heartbeat ('Mac last seen') is recorded; queued → done takes ≤ 5 minutes while the Mac is awake
<!-- AC:END -->
