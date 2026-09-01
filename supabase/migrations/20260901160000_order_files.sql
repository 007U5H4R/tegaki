-- T04 · handwriting samples: private storage and its access rules
--
-- This is the migration that matters most in the whole project. Solution-PRD
-- §2.4 promises that no handwriting sample is reachable by anyone except its
-- subject's account and the admin, and that promise is kept here or nowhere.
--
-- The object PATH is the security boundary:
--     samples/{buyer_uid}/{order_id}/v{n}/{uuid}.{ext}
--
-- Every policy checks the first path segment against auth.uid(), and the
-- upload policy additionally proves the second segment names a real order
-- that the caller owns and that is currently open for uploads. A forged path
-- therefore fails on ownership, not merely on convention.

-- ── Guardrails acknowledgement (wizard stage 2 gate) ────────────────────────
--
-- Persisted on the order rather than in the browser, so it survives a resumed
-- wizard and remains auditable: for a service handling third-party consent,
-- "did they see the rules?" is a question worth being able to answer.

alter table public.orders
  add column guardrails_acked jsonb not null default '{}'::jsonb;

grant update (guardrails_acked) on public.orders to authenticated;

-- ── order_files ─────────────────────────────────────────────────────────────

create table public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id),

  -- Versioned rather than overwritten. A rejected sample and its replacement
  -- are both evidence: without history, "the file I sent was fine" and "the
  -- file I received was blurry" cannot both be checked.
  version int not null default 1 check (version > 0),

  bucket_path text not null unique,
  file_name text not null,
  mime text not null check (mime in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 20971520),

  created_at timestamptz not null default now()
);

comment on table public.order_files is
  'Uploaded handwriting samples. Rows are metadata; the bytes live in the private `samples` bucket.';

create index order_files_order_version_idx on public.order_files (order_id, version desc, created_at desc);

alter table public.order_files enable row level security;

create policy "order_files: read own"
  on public.order_files for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_files.order_id and o.buyer_id = auth.uid()
    )
  );

create policy "order_files: admin reads all"
  on public.order_files for select
  to authenticated
  using (public.is_admin());

-- Uploads are only accepted while the order is actually asking for them.
create policy "order_files: attach to own open order"
  on public.order_files for insert
  to authenticated
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_files.order_id
        and o.buyer_id = auth.uid()
        and o.status in ('draft', 'needs_reupload')
    )
  );

-- Removing a file you have just added is housekeeping; removing one an
-- analyst is working from is not. There is deliberately no UPDATE policy:
-- a file row is a fact about what was uploaded and when.
create policy "order_files: remove from own draft"
  on public.order_files for delete
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_files.order_id
        and o.buyer_id = auth.uid()
        and o.status = 'draft'
    )
  );

grant select, insert, delete on public.order_files to authenticated;
grant all on public.order_files to service_role;

-- ── The private bucket ──────────────────────────────────────────────────────
--
-- `public = false` is the single most important flag in this file. A public
-- bucket would make every sample readable by anyone holding the URL, and URLs
-- leak: through browser history, referrer headers, and shared screenshots.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'samples',
  'samples',
  false,
  20971520, -- 20 MB, matching the size check on order_files
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage policies ────────────────────────────────────────────────────────
--
-- There is no policy for the anon role anywhere below, so an unauthenticated
-- request cannot read, list or write a sample under any circumstances.

create policy "samples: owner reads own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'samples'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "samples: admin reads all"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'samples' and public.is_admin());

create policy "samples: owner uploads to own open order"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'samples'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.buyer_id = auth.uid()
        and o.status in ('draft', 'needs_reupload')
    )
  );

create policy "samples: owner deletes from own draft"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'samples'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.buyer_id = auth.uid()
        and o.status = 'draft'
    )
  );
