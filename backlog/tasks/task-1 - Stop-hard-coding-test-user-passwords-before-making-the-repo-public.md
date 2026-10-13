---
id: TASK-1
title: Stop hard-coding test-user passwords before making the repo public
status: Done
assignee: []
created_date: '2026-09-29 12:24'
updated_date: '2026-09-29 12:38'
labels:
  - P1
dependencies: []
priority: high
type: chore
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tushar 2026-09-29 wants tegaki public. Its RLS and e2e tests hard-code passwords for the test users they create in the real Supabase project. Generate them per run, remove any leftover test users, then make the repo public.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Per-run test passwords (65e2675, pushed to main). Supabase has only 2 real Google accounts and no password-based test users, so the old passwords in history can't log anyone in. The account-deletion test passed against the real project and left no user behind. Repo made public 2026-09-29.
<!-- SECTION:NOTES:END -->
