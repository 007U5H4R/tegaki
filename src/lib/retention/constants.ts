/**
 * How long a handwriting sample is kept after the report is delivered.
 *
 * This number is written twice: here, and in `retention_days()` in
 * 20260902180000_retention.sql. The database's copy is the one that decides
 * what gets deleted; this one is what the policy page tells customers.
 * `tests/rls/retention.test.ts` asserts they are the same number, because the
 * failure mode otherwise is a page promising ninety days while the job runs
 * on some other figure — a broken promise that nothing would ever report.
 */
export const RETENTION_DAYS = 90

export const SAMPLES_PURGED_NOTICE =
  'Your handwriting samples were deleted after the retention period. Your report is unaffected and stays available here.'
