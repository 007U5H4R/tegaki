-- T01/D4 · service_role grants
--
-- This project was created with "automatically expose new tables" disabled,
-- which switches off Supabase's default privileges for EVERY role — not just
-- the client-facing ones. So `service_role` was left without grants and its
-- queries failed with 42501 (insufficient_privilege), which surfaced first in
-- the isolation test fixtures and would have broken the retention cron in T15.
--
-- Granting service_role full access to a table costs nothing in security:
-- the key already bypasses RLS by design, so withholding grants adds friction
-- without adding defence. The client-facing roles are where restraint matters,
-- and those stay narrow — `authenticated` still cannot write `role`.
--
-- ⚠️ Every future migration that creates a table must grant BOTH:
--       grant <narrow columns/verbs> on <table> to authenticated;
--       grant all on <table> to service_role;
--    Forgetting the second one fails only in server-side paths, which is a
--    slow and confusing way to find out.

grant all on public.profiles to service_role;
