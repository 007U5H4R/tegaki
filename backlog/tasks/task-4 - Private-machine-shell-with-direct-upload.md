---
id: TASK-4
title: Private /machine shell with direct upload
status: In Review
assignee: []
created_date: '2026-10-13 13:03'
updated_date: '2026-10-13 14:02'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-0
dependencies: []
priority: high
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tushar signs in, opens /machine, creates a client (name, pronouns, avatar variant, tier) and uploads JPEG/PNG handwriting pages and an optional signature into private storage. Anyone who isn't an admin gets a 404, and no machine data or file is readable by them.

Tegaki Machine TKT-02. Related EVAL: EVAL-020, EVAL-024. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /machine and every route under it return 404 for signed-out and non-admin users
- [ ] #2 machine_clients and machine_samples exist with admin-only row-level security; the machine bucket is private and admin-only
- [ ] #3 Uploaded pages appear as thumbnails, with the original stored
- [ ] #4 Pronouns are always an explicit choice (never inferred); the page renders under the paper theme per Design.md
- [ ] #5 Access tests: a non-admin reads 0 rows and 0 files through the API, the database and direct storage URLs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Committed on feat/tegaki-machine. Unit gates pass. BLOCKED for Done: RLS + e2e tests need the migration applied (Tushar's go-ahead); browser check needs an admin session.
<!-- SECTION:NOTES:END -->
