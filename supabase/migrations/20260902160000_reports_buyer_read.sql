-- T09 · let a customer actually open their own report
--
-- Correcting an assumption in 20260902150000_reports.sql. That migration gave
-- the reports bucket no buyer policy at all, on the reasoning that customers
-- never touch report storage directly — they go through a server action that
-- mints a short-lived signed URL.
--
-- The reasoning was right about the shape and wrong about the mechanics.
-- Signing a URL is itself an authorised read of the object: with no select
-- policy, `createSignedUrl` as the buyer fails with "Object not found", and
-- the customer's download button does nothing. Proven before writing this.
--
-- So the buyer gets the narrowest possible read: the object's first path
-- segment must name an order they own. Exactly the shape the `samples`
-- policies use, and the same reason it works — the path IS the boundary.
--
-- What has not changed: the bucket is still private, there is still no buyer
-- INSERT, UPDATE or DELETE, and the app still hands out sixty-second links.
-- What has changed is that the sixty seconds is now a courtesy to the
-- customer rather than a wall around their own data — which is what it always
-- actually was.

create policy "reports: buyer reads their own order's report"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'reports'
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[1]
        and o.buyer_id = auth.uid()
    )
  );
