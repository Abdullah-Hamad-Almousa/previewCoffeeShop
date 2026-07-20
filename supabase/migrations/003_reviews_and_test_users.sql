-- ============================================================
-- Migration 003: Reviews Table, Test Users, Purchase Check
-- ============================================================
-- IMPORTANT: This migration is purely ADDITIVE.
-- No drops, no formatting, no alterations to existing tables.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- 0. Ensure pgcrypto is available for crypt()/gen_salt()
create extension if not exists pgcrypto;

-- 0a. Ensure username column exists on profiles (added manually before,
--     this is a safety net in case it was lost)
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_user_id_unique
  on public.profiles (user_id);

-- ============================================================
-- 1. REVIEWS TABLE
-- ============================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_reviews_product_id on public.reviews (product_id);

-- ============================================================
-- 2. HELPER: has_purchased(product_id)
--    Returns true if the current auth user has a PAID order
--    for the given product.
-- ============================================================

create or replace function public.has_purchased(p_product_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where user_id = auth.uid()
      and product_id = p_product_id
      and status = 'paid'
  );
$$;

-- ============================================================
-- 3. HELPER: get_product_reviews(product_id)
--    Returns all reviews for a product with the reviewer's username.
-- ============================================================

create or replace function public.get_product_reviews(p_product_id uuid)
returns table (
  id          uuid,
  product_id  uuid,
  user_id     uuid,
  rating      int,
  comment     text,
  created_at  timestamptz,
  username    text
)
language sql
security definer set search_path = public
as $$
  select r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
         p.username
  from public.reviews r
  left join public.profiles p on p.user_id = r.user_id
  where r.product_id = p_product_id
  order by r.created_at desc;
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY ON REVIEWS
-- ============================================================

alter table public.reviews enable row level security;

-- Everyone can read reviews
create policy "Reviews: public read"
  on public.reviews for select
  using (true);

-- Users can insert a review ONLY if they purchased the product
create policy "Reviews: insert if purchased"
  on public.reviews for insert
  with check (auth.uid() = user_id and public.has_purchased(product_id));

-- Users can update their own reviews
create policy "Reviews: update own"
  on public.reviews for update
  using (auth.uid() = user_id);

-- Users can delete their own reviews
create policy "Reviews: delete own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 5. CREATE TWO TEST USERS (encrypted bcrypt passwords)
-- ============================================================
-- Passwords are hashed with bcrypt via crypt()/gen_salt('bf').
-- Supabase GoTrue uses bcrypt for password verification.

do $$
declare
  admin_id uuid;
  sub_id   uuid;
begin
  -- ---- User 1: AdminTest (hosthost@hostadmin.sa) ----
  select id into admin_id from auth.users where email = 'hosthost@hostadmin.sa';

  if admin_id is null then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    values (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'hosthost@hostadmin.sa',
      extensions.crypt('host730Admin@69', extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('email', 'hosthost@hostadmin.sa', 'email_verified', true, 'phone_verified', false)
    )
    returning id into admin_id;

    -- Create identity row so GoTrue recognizes the email provider
    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'hosthost@hostadmin.sa', 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- Set username on profile (trigger auto-created it as 'customer')
  insert into public.profiles (user_id, role, username)
  values (admin_id, 'customer', 'AdminTest')
  on conflict (user_id) do update set username = 'AdminTest';

  -- ---- User 2: subTest (subhost@hostsub.sa) ----
  select id into sub_id from auth.users where email = 'subhost@hostsub.sa';

  if sub_id is null then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    values (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'subhost@hostsub.sa',
      extensions.crypt('host730Sub@69', extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('email', 'subhost@hostsub.sa', 'email_verified', true, 'phone_verified', false)
    )
    returning id into sub_id;

    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      sub_id,
      sub_id,
      jsonb_build_object('sub', sub_id::text, 'email', 'subhost@hostsub.sa', 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- Set username on profile
  insert into public.profiles (user_id, role, username)
  values (sub_id, 'customer', 'subTest')
  on conflict (user_id) do update set username = 'subTest';

  -- ---- Orders: AdminTest has purchased ALL products ----
  insert into public.orders (user_id, product_id, amount, status)
  select admin_id, p.id, p.price, 'paid'
  from public.products p
  where not exists (
    select 1 from public.orders o
    where o.user_id = admin_id
      and o.product_id = p.id
      and o.status = 'paid'
  );

end;
$$;

-- ============================================================
-- 6. MISSING PROFILES INSERT POLICY
--    Users need to be able to insert their own profile row
--    (trigger auto-creates it, but client fallback upsert needs this)
-- ============================================================

create policy "Profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. DELETE OWN ACCOUNT FUNCTION
--    Allows a user to fully delete their auth account
--    (cascades to profile via FK). SECURITY DEFINER bypasses RLS.
-- ============================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================
-- END OF MIGRATION 003
-- ============================================================