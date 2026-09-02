-- Deleting an account must not be blocked by the files it uploaded
--
-- `order_files.uploader_id` was created without an ON DELETE rule, so it
-- defaulted to NO ACTION. The effect: once somebody had uploaded a single
-- sample, deleting their account failed with "Database error deleting user".
--
-- Their orders would have gone (buyer_id already cascades) and the file rows
-- with them (order_id already cascades) — this one column was the only thing
-- refusing, and it refused for no benefit.
--
-- Found while clearing test accounts out of the project. It would have
-- surfaced far more expensively in T15, where deleting data on request is the
-- entire ticket, or the first time a real customer asked to be removed.
--
-- Cascade is the right rule: uploader_id is always the buyer (the insert
-- policy requires it), so it can never point at someone who should outlive
-- the row.

alter table public.order_files
  drop constraint order_files_uploader_id_fkey;

alter table public.order_files
  add constraint order_files_uploader_id_fkey
  foreign key (uploader_id) references public.profiles (id) on delete cascade;
