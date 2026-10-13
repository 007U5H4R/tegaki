---
id: TASK-12
title: Upload handwriting in any common format
status: To Do
assignee: []
created_date: '2026-10-13 13:03'
labels:
  - P2
  - tegaki-machine
  - 'sp:5'
milestone: m-2
dependencies:
  - TASK-4
priority: medium
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uploads accept JPEG, PNG, HEIC/HEIF, WebP, TIFF, BMP, GIF, multi-page PDF (one image per page) and DOCX (embedded photos), converted in the browser to JPEG pages of about 0.5 MB with the original kept. Unsupported files are rejected with a message naming what works.

Tegaki Machine TKT-10. Related EVAL: EVAL-036. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every fixture format produces the expected JPEG pages
- [ ] #2 An unsupported file (e.g. .txt) is rejected with the message
- [ ] #3 Each page is ≤ about 0.5 MB, and the original file is stored
<!-- AC:END -->
