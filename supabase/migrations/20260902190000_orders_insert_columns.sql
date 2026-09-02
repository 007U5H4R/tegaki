-- Review-gate fix: the INSERT grant on orders was table-wide.
--
-- UPDATE has been column-restricted since T03, and every status change goes
-- through transition_order(). INSERT was not restricted, and the insert
-- policy only checks buyer_id = auth.uid() — so a signed-in buyer calling
-- PostgREST directly could create an order already in 'sample_under_review'
-- or 'analysis_in_progress', with an invented expected_delivery_date and
-- approval stamps, skipping submit_order() and everything it asserts about
-- tier, sample, consent and payment.
--
-- The app inserts exactly one column (createDraftOrder writes buyer_id and
-- lets status default to 'draft'), so that is the whole grant.

revoke insert on public.orders from authenticated;
grant insert (buyer_id) on public.orders to authenticated;
