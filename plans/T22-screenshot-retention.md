# Plan — T22 · Retention and delete-my-data cover payment screenshots

> **Ticket:** T22 · Campfire TASK-22.9 · **Phase 9** · **Blocked by:** T17.
> **Delivers:** payment screenshots are deleted on the same schedule as samples (90 days after delivery) and on erasure. The payment row keeps its amount and status, but no screenshot path that resolves.
> **Read first:** `technical-plan.md` §2.2 · `supabase/migrations/20260902180000_retention.sql` · `src/lib/retention/purge.ts` · `tests/rls/retention.test.ts` · `plans/RUNBOOK-delete-my-data.md`.

## Design decisions locked here
- **Same machinery, same order:** objects first, then rows, with the SQL function re-deriving the set it deletes. That is what makes an interrupted run harmless and a second run safe (the T15 design).
- **The `payment_proofs` rows go; the `payments` row stays.** The books still balance, and nothing resolvable remains.
- **Same window:** `retention_days()`. There is no new constant.

## Tasks

**A1 · Migration `…_retention_payment_proofs.sql`**
- **`expiring_payment_proofs(p_days)`:** returns `(order_id, bucket_path)` for orders whose `delivered_at` is older than the window. The guard is the same as `expiring_sample_files`.
- **`purge_expired_payment_proofs(p_days)`:**
  - deletes the matching `payment_proofs` rows
  - returns `(proofs_deleted int)`
  - re-checks the window
  - is idempotent
- **`purge_order_data()`:** re-created so that it also returns `('payment-screenshots', bucket_path)` for every proof.
  - **Redact mode** deletes the proof rows.
  - **Erase mode** already cascades.

*Gate:* `tests/rls/retention-payment-proofs.test.ts`:
- Fixtures delivered 89, 90 and 91 days ago: only the 91-day order's proofs are listed and purged.
- A second run deletes 0.
- A buyer is refused.
- `purge_order_data` returns the screenshot paths in both modes.

**B1 · `runRetention()`**
- Adds a second pass for the `payment-screenshots` bucket, in the same object-then-row order, batched by 100.
- `RetentionReport` gains `screenshotObjectsDeleted` and `proofsDeleted`.
- Object errors land in the same `objectErrors` list, which already makes the route return 500.

*Gate:* the route test with a stubbed client asserts the new counts appear in the `[retention]` log line.

**B2 · Erasure path**
- The admin erase action (`eraseOrderData`) already removes the returned paths grouped by bucket. Confirm it doesn't hard-code `samples`; if it does, group by the returned `bucket`.

*Gate:* an e2e or RLS test where erasing an order with a screenshot leaves no object in the bucket.

**C1 · Runbook**
- `plans/RUNBOOK-delete-my-data.md` gains one line: payment screenshots are included, and the payment amount and status remain in redact mode.

**C2 · Copy check**
- The Privacy policy (T21) states the same 90-day rule for screenshots. Read it, and confirm the wording matches what this job actually does.

## Definition of done
- [ ] Fixture tests pass at 89, 90 and 91 days.
- [ ] Delete-my-data removes the screenshots.
- [ ] Both paths are idempotent and log their counts.
- [ ] Typecheck, lint, the claims guard and the tests are green.
