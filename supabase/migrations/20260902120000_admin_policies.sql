-- T07/A1 · what an admin is allowed to read
--
-- `is_admin()` and the admin read policies on `order_files` and `payments`
-- already exist (T03, T04, T06). This adds the two that were missing:
-- `orders` and `profiles`.
--
-- Admin access is granted through RLS rather than by reaching for the service
-- key. The distinction matters: with a policy, an admin request still carries
-- that person's identity into the database and is still subject to a rule
-- that can be read and tested. The service key answers to nobody, so it stays
-- reserved for cron (T15) and the test fixtures.
--
-- `is_admin()` is security definer, so its own lookup inside `profiles` does
-- not re-enter the policy below. That is the reason it was written that way
-- in T03 rather than as a plain sql expression.

create policy "orders: admin reads all"
  on public.orders for select
  to authenticated
  using (public.is_admin());

-- The admin needs to know which account placed an order, which is not the
-- same as the contact email captured in the wizard: one is the identity, the
-- other is where the customer asked to be written to.
create policy "profiles: admin reads all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Note what is NOT here. There is no admin INSERT, UPDATE or DELETE policy on
-- any of these tables. Status changes go through transition_order(), which
-- checks the caller and the edge together; nothing else about an order is an
-- admin's to rewrite. A policy allowing "admin can update orders" would be
-- broader than any actual requirement.
