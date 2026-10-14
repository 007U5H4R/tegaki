# Milestones — Tegaki

> M-001…M-004 belong to Tegaki Machine (Campfire milestones m-0…m-3). The pilot build (T01–T15) predates milestones. This file starts with the payments amendment.

## M-005 · Ops hardening before real money
- **Objective:** the site can't break silently and is served on its real domain.
- **Scope:** T24 (keep-alive + RCA), T25 (tegaki.tusharpathak.com).
- **Entry:** none (both can start now). **Exit:** keep-alive deployed and verified; Google sign-in works on the new domain; the old URL redirects.
- **DoD:** baseline gate; production verification; RCA1 recorded.
- **Sequence / priority / status:** 1 · High · Not started.
- **Risks:** Google OAuth or Supabase redirect misconfiguration locks customers out (mitigation: verify on production before the redirect goes live).

## M-006 · Real payments by UPI QR
- **Objective:** a stranger can pay for a reading, and Tushar can verify, reject or refund it, with the database enforcing that no unpaid work starts.
- **Scope:** T16–T23.
- **Entry:** Solution-PRD v1.1 + Design.md §6 approved (done). **Exit:** T23 walk-through signed off and `PAYMENTS_MODE=live`, demo checkout removed.
- **DoD:** baseline gate on every ticket; RLS tests for the gate, permissions and screenshot privacy; standing UI gates; manual scan-and-cancel.
- **Sequence / priority / status:** 2 (T16 may start in parallel with M-005) · High · Not started.
- **Dependencies:** M-005 must be done before T23 flips the switch. Tickets ship one by one behind `PAYMENTS_MODE`.
- **Risks:** a UPI app ignoring the amount or note (caught by the T16 manual check); Vercel Hobby terms (accepted, S8); the first real payment is also the first real credit (accepted, EV5/S3).
