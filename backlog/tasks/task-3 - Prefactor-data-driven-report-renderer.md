---
id: TASK-3
title: 'Prefactor: data-driven report renderer'
status: Done
assignee: []
created_date: '2026-10-13 13:03'
updated_date: '2026-10-13 13:38'
labels:
  - P1
  - tegaki-machine
  - 'sp:5'
milestone: m-0
dependencies: []
priority: high
type: task
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The report renderer accepts a structured draft (JSON: profile, 16 sections, Express extras) instead of a Markdown file, lives versioned in the Graphology repo with a client-free base.docx (no Varun text), and still produces the approved layout for every tier.

Tegaki Machine TKT-01. Related EVAL: EVAL-038, EVAL-004. Spec: Tegaki Machine/tickets.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rendering the sample client's content from a JSON draft gives 2 / 5 / 9 pages after the cover for Express / Core / Comprehensive (golden test)
- [ ] #2 The committed base.docx contains no client names or report prose (automated check)
- [ ] #3 All existing build checks still run: no em dashes, 12 traits, tier sections, page budget, no leftovers
- [ ] #4 The draft JSON shape is documented as a schema and validated before rendering
<!-- AC:END -->
