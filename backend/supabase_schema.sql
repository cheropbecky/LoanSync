-- ============================================================
-- LoanSync — Supabase Database Schema (v2)
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Safe to re-run: all CREATE statements are preceded by DROP IF EXISTS.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade unique,
  name text not null default '',
  email text not null,
  phone text not null default '',
  location text,
  role text not null default 'shop' check (role in ('shop', 'admin')),
  created_at timestamptz default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade not null,
  borrower_name text not null,
  phone text not null,
  amount numeric(12,2) not null check (amount > 0),
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'active' check (status in ('active', 'paid', 'overdue')),
  note text,
  created_at timestamptz default now()
);

create table if not exists mpesa_transactions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id) on delete set null,
  checkout_request_id text unique not null,
  merchant_request_id text,
  phone text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  mpesa_receipt text,
  result_code int,
  created_at timestamptz default now()
);

-- Pre-registered shops created by an admin BEFORE the actual shop owner has
-- signed up. When a new user signs up with a matching phone or email, the
-- trigger below auto-links their new `shops` row to this pending record
-- (carrying over the name/location the admin already entered) and marks
-- it claimed.
create table if not exists pending_shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  location text,
  email text,
  claimed boolean not null default false,
  claimed_by uuid references auth.users(id),
  created_by uuid references auth.users(id), -- the admin who registered it
  created_at timestamptz default now()
);

create index if not exists idx_pending_shops_phone on pending_shops(phone);
create index if not exists idx_pending_shops_email on pending_shops(email);

create index if not exists idx_loans_shop_id on loans(shop_id);
create index if not exists idx_loans_status on loans(status);
create index if not exists idx_shops_owner_id on shops(owner_id);
create index if not exists idx_mpesa_checkout on mpesa_transactions(checkout_request_id);

-- ============================================================
-- 2. AUTO-CREATE SHOP ROW ON SIGNUP (fixes the RLS-on-signup issue)
-- ============================================================
-- Runs server-side the instant a row appears in auth.users — works
-- whether "Confirm email" is ON or OFF, because it never depends on
-- the user having an active session. SECURITY DEFINER means it runs
-- with elevated privileges and bypasses RLS safely.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  match record;
  new_phone text;
begin
  new_phone := coalesce(new.raw_user_meta_data->>'phone', '');

  -- Check if an admin already pre-registered this person (matched by email
  -- first, falling back to phone), and hasn't been claimed yet.
  select * into match
  from pending_shops
  where claimed = false
    and (email = new.email or (new_phone <> '' and phone = new_phone))
  order by created_at asc
  limit 1;

  if match.id is not null then
    insert into public.shops (owner_id, name, email, phone, location, role)
    values (new.id, match.name, new.email, match.phone, match.location, 'shop');

    update pending_shops
    set claimed = true, claimed_by = new.id
    where id = match.id;
  else
    insert into public.shops (owner_id, name, email, phone, location, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      new_phone,
      null,
      'shop'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table shops enable row level security;
alter table loans enable row level security;
alter table mpesa_transactions enable row level security;
alter table pending_shops enable row level security;

-- ---- SHOPS policies ----
-- No INSERT policy needed anymore — the trigger above (SECURITY DEFINER)
-- handles row creation and bypasses RLS entirely.

drop policy if exists "Shops: owner can select own row" on shops;
create policy "Shops: owner can select own row"
  on shops for select
  using (owner_id = auth.uid());

drop policy if exists "Shops: owner can update own row" on shops;
create policy "Shops: owner can update own row"
  on shops for update
  using (owner_id = auth.uid());

-- Drop the old manual-insert policy if it exists from a previous run —
-- it's no longer needed now that the trigger creates the row.
drop policy if exists "Shops: authenticated users can insert their own row" on shops;

-- ---- LOANS policies ----

drop policy if exists "Loans: owner can select own shop's loans" on loans;
create policy "Loans: owner can select own shop's loans"
  on loans for select
  using (
    shop_id in (select id from shops where owner_id = auth.uid())
  );

drop policy if exists "Loans: owner can insert into own shop" on loans;
create policy "Loans: owner can insert into own shop"
  on loans for insert
  with check (
    shop_id in (select id from shops where owner_id = auth.uid())
  );

drop policy if exists "Loans: owner can update own shop's loans" on loans;
create policy "Loans: owner can update own shop's loans"
  on loans for update
  using (
    shop_id in (select id from shops where owner_id = auth.uid())
  );

drop policy if exists "Loans: owner can delete own shop's loans" on loans;
create policy "Loans: owner can delete own shop's loans"
  on loans for delete
  using (
    shop_id in (select id from shops where owner_id = auth.uid())
  );

-- NOTE: Admin-wide visibility across ALL shops/loans is intentionally NOT
-- granted via RLS here. The admin dashboard reads through the Express
-- backend using the Supabase SERVICE ROLE key, which bypasses RLS entirely.
-- This keeps cross-shop aggregation server-side and auditable, rather than
-- exposing a "see everything" policy to any client-side key.

-- ---- MPESA_TRANSACTIONS ----
-- No public policies defined on purpose. RLS is enabled with zero policies,
-- which means anon/authenticated roles get zero access by default — this
-- table is only ever touched by the backend via the service role key.

-- ---- PENDING_SHOPS ----
-- Same pattern: no public policies. Only the admin backend (service role
-- key) creates and reads these rows. The handle_new_user() trigger above
-- can still read this table because it runs as SECURITY DEFINER, which
-- bypasses RLS regardless of policies.

-- ============================================================
-- 4. BACKFILL — create shop rows for any existing users that don't have one
-- ============================================================
-- Safe to run even if everyone already has a row (ON CONFLICT does nothing).

insert into public.shops (owner_id, name, email, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  u.email,
  coalesce(u.raw_user_meta_data->>'phone', ''),
  'shop'
from auth.users u
left join public.shops s on s.owner_id = u.id
where s.id is null
on conflict (owner_id) do nothing;

-- ============================================================
-- 5. PROMOTE A USER TO ADMIN (run manually, replace the email)
-- ============================================================
-- update shops set role = 'admin' where email = 'admin@loansync.app';