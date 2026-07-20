-- ============================================================
-- Migration 005: Seed Reviews for All Products
-- ============================================================
-- Creates 5 reviewer users, then inserts 4-8 reviews per product
-- with ratings between 3.0 and 5.0 (including 3.5, 4.5, etc.)
-- and bilingual comments. Idempotent — safe to run multiple times.
-- ============================================================

-- 1. Create 5 reviewer users (fixed UUIDs for idempotency)
do $$
declare
  reviewer_ids uuid[] := array[
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
  ];
  r_id uuid;
  r_email text;
  r_idx int;
begin
  for r_idx in 1..array_length(reviewer_ids, 1)
  loop
    r_id := reviewer_ids[r_idx];
    r_email := 'reviewer' || r_idx || '@mysticcoffee.sa';

    -- Insert user if not exists
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    select
      r_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      r_email,
      extensions.crypt('reviewer123@M', extensions.gen_salt('bf', 10)),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('email', r_email, 'email_verified', true)
    where not exists (select 1 from auth.users where id = r_id);

    -- Insert identity if not exists
    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    select gen_random_uuid(), r_id, r_id,
      jsonb_build_object('sub', r_id::text, 'email', r_email, 'email_verified', true),
      'email', now(), now(), now()
    where not exists (select 1 from auth.identities where user_id = r_id);
  end loop;

  -- Create profiles with usernames
  insert into public.profiles (user_id, role, username) values
    ('a1111111-1111-1111-1111-111111111111', 'customer', 'coffee_lover'),
    ('a2222222-2222-2222-2222-222222222222', 'customer', 'espresso_fan'),
    ('a3333333-3333-3333-3333-333333333333', 'customer', 'latte_queen'),
    ('a4444444-4444-4444-4444-444444444444', 'customer', 'cafe_hopper'),
    ('a5555555-5555-5555-5555-555555555555', 'customer', 'mocha_addict')
  on conflict (user_id) do update set username = excluded.username;
end;
$$;

-- 2. Seed reviews for every product
do $$
declare
  reviewer_ids uuid[] := array[
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
  ];
  prod record;
  i int;
  num_reviews int;
  chosen_reviewer uuid;
  rating numeric;
  comment_en text;
  reviewer_idx int;
begin
  for prod in select id, name_en from public.products order by id
  loop
    -- Delete old seeded reviews for this product first
    delete from public.reviews
    where product_id = prod.id
      and user_id = any(reviewer_ids);

    -- Random number of reviews: 4 to 8
    num_reviews := 4 + floor(random() * 5)::int;

    for i in 1..num_reviews
    loop
      -- Cycle through reviewers (ensures unique per product)
      reviewer_idx := ((i - 1) % 5) + 1;
      chosen_reviewer := reviewer_ids[reviewer_idx];

      -- Random rating: 3.5, 4.0, 4.5, or 5.0
      rating := (7 + floor(random() * 4)) / 2.0;
      if rating > 5.0 then rating := 5.0; end if;

      -- Comment based on rating tier
      if rating >= 4.5 then
        comment_en := (array['Amazing coffee, highly recommend!', 'Best I have had in a while', 'Perfect taste and aroma', 'Absolutely loved it!'])[1 + floor(random() * 4)::int];
      elsif rating >= 4.0 then
        comment_en := (array['Really good coffee', 'Solid choice, would order again', 'Great flavor', 'Pretty tasty'])[1 + floor(random() * 4)::int];
      elsif rating >= 3.5 then
        comment_en := (array['Decent coffee, nothing special', 'It was okay, could be better', 'Not bad for the price', 'Average taste'])[1 + floor(random() * 4)::int];
      else
        comment_en := (array['Expected more honestly', 'A bit underwhelming', 'Could use more flavor', 'Just okay'])[1 + floor(random() * 4)::int];
      end if;

      -- Insert review if not already exists
      insert into public.reviews (product_id, user_id, rating, comment)
      values (prod.id, chosen_reviewer, rating, comment_en)
      on conflict (product_id, user_id) do nothing;
    end loop;
  end loop;
end;
$$;

-- ============================================================
-- 3. RPC: get_all_product_ratings()
--    Returns product_id, avg_rating, review_count for ALL products.
-- ============================================================
create or replace function public.get_all_product_ratings()
returns table (
  product_id uuid,
  avg_rating numeric(2, 1),
  review_count bigint
)
language sql
security definer set search_path = public
as $$
  select
    product_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*) as review_count
  from public.reviews
  group by product_id;
$$;

-- ============================================================
-- END OF MIGRATION 005
-- ============================================================