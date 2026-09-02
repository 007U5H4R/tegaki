-- T05 · wizard stage 1: who the assessment is for
--
-- Solution-PRD §6.3. Two things here are not merely form fields:
--
-- Gender exists only so the report can use the right pronouns and address
-- the subject naturally. It is not an analysis input.
--
-- Consent is the one that matters. When somebody orders an assessment of
-- another person's handwriting, that person has not agreed to anything by
-- being written about. The constraint at the bottom makes an order without
-- consent impossible to submit, rather than merely discouraged by a form.

alter table public.orders
  add column full_name text,
  add column age int check (age is null or age between 5 and 120),
  add column gender text,
  add column city text,
  add column country text,
  add column email text,
  add column phone text,
  add column whatsapp_preferred boolean not null default false,

  add column subject_is_self boolean not null default true,
  add column subject_name text,
  add column subject_age int check (subject_age is null or subject_age between 5 and 120),
  add column consent_given_at timestamptz;

comment on column public.orders.gender is
  'Used only for pronouns and address in the report. Never an analysis input.';
comment on column public.orders.consent_given_at is
  'When the buyer confirmed they have the subject''s permission. Required before submission when the subject is not the buyer.';

-- A draft is allowed to be half-finished — people fill forms over time. But
-- an order that has left draft must satisfy the consent rule, and the
-- database is where that is guaranteed rather than hoped for.
alter table public.orders
  add constraint orders_consent_required_when_submitted
  check (
    status = 'draft'
    or subject_is_self
    or consent_given_at is not null
  );

-- Stage-1 fields join the narrow UPDATE grant. `status`, `submitted_at` and
-- `consent_given_at` stay out of it: the first two belong to the state
-- machine, and consent is stamped server-side from an explicit tick rather
-- than being a value a client can post.
grant update (
  full_name, age, gender, city, country, email, phone, whatsapp_preferred,
  subject_is_self, subject_name, subject_age
) on public.orders to authenticated;

-- ── Saving stage 1 ──────────────────────────────────────────────────────────
--
-- A definer function, because stamping consent_given_at requires writing a
-- column the buyer cannot write directly. Passing the tick as a boolean and
-- deriving the timestamp here means the client never chooses when consent
-- was given.

create or replace function public.save_order_profile(
  p_order_id uuid,
  p_full_name text,
  p_age int,
  p_gender text,
  p_city text,
  p_country text,
  p_email text,
  p_phone text,
  p_whatsapp boolean,
  p_subject_is_self boolean,
  p_subject_name text,
  p_subject_age int,
  p_consent boolean
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'no_data_found';
  end if;

  if o.buyer_id <> auth.uid() then
    raise exception 'That order is not yours' using errcode = 'insufficient_privilege';
  end if;

  if o.status <> 'draft' then
    raise exception 'This order has been submitted and can no longer be edited'
      using errcode = 'check_violation';
  end if;

  if not p_subject_is_self and not p_consent then
    raise exception 'Consent is required when the assessment is for someone else'
      using errcode = 'check_violation';
  end if;

  update public.orders
     set full_name = p_full_name,
         age = p_age,
         gender = nullif(trim(coalesce(p_gender, '')), ''),
         city = p_city,
         country = p_country,
         email = lower(trim(p_email)),
         phone = p_phone,
         whatsapp_preferred = coalesce(p_whatsapp, false),
         subject_is_self = p_subject_is_self,
         subject_name = case when p_subject_is_self then null else p_subject_name end,
         subject_age = case when p_subject_is_self then null else p_subject_age end,
         -- Consent is cleared if the buyer switches back to themselves, so a
         -- stale timestamp cannot outlive the answer it belonged to.
         consent_given_at = case
           when p_subject_is_self then null
           when p_consent then coalesce(o.consent_given_at, now())
           else null
         end,
         wizard_stage = greatest(o.wizard_stage, 2)
   where id = p_order_id
   returning * into o;

  return o;
end;
$$;

revoke all on function public.save_order_profile(
  uuid, text, int, text, text, text, text, text, boolean, boolean, text, int, boolean
) from public;
grant execute on function public.save_order_profile(
  uuid, text, int, text, text, text, text, text, boolean, boolean, text, int, boolean
) to authenticated, service_role;
