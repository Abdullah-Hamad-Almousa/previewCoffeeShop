-- Preview Coffee Shop — Full Migration (v preview 1.0.0)
-- Run this in Supabase SQL Editor as a single migration.

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles: links each auth user to a role
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('customer', 'manager')) default 'customer',
  created_at  timestamptz not null default now()
);

-- products: bilingual catalog
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_ar         text not null,
  description_en  text,
  description_ar  text,
  price           numeric(10, 2) not null check (price >= 0),
  image_url       text,
  initials        text not null,
  created_at      timestamptz not null default now()
);

-- queues: max 4 (enforced by check constraint), only 1 active at a time
create table if not exists public.queues (
  id               int primary key check (id between 1 and 4),
  name             text not null,
  is_active        boolean not null default false,
  current_position int not null default 1,
  started_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- queue_items: products inside a queue, ordered by position
create table if not exists public.queue_items (
  id          uuid primary key default gen_random_uuid(),
  queue_id    int not null references public.queues (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  position    int not null check (position >= 1),
  created_at  timestamptz not null default now(),
  unique (queue_id, position)
);

-- recommendations: 24H window per product
create table if not exists public.recommendations (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

-- orders: payment records
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  amount      numeric(10, 2) not null check (amount >= 0),
  status      text not null check (status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  moyasar_id  text,
  created_at  timestamptz not null default now()
);

-- app_settings: key-value flags (payment_super, payment_enabled)
create table if not exists public.app_settings (
  key    text primary key,
  value  boolean not null default false
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Partial unique index: only ONE queue can be active at a time
create unique index if not exists queues_only_one_active
  on public.queues (is_active)
  where is_active = true;

-- Helpful lookups
create index if not exists idx_queue_items_queue_id   on public.queue_items (queue_id);
create index if not exists idx_queue_items_product_id on public.queue_items (product_id);
create index if not exists idx_recommendations_product_id on public.recommendations (product_id);
create index if not exists idx_orders_user_id         on public.orders (user_id);

-- ============================================================
-- 3. TRIGGER: auto-create profile on new auth user
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'customer')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. HELPER FUNCTION: is_manager()
-- ============================================================
-- Must be defined BEFORE RLS policies that reference it.

create or replace function public.is_manager()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'manager'
  );
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.products        enable row level security;
alter table public.queues          enable row level security;
alter table public.queue_items     enable row level security;
alter table public.recommendations enable row level security;
alter table public.orders          enable row level security;
alter table public.app_settings    enable row level security;

-- ---------- profiles ----------
-- Each user can read their own profile
create policy "Profiles: read own"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Users can update their own profile (but NOT role — locked via trigger below)
create policy "Profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id);

-- ---------- products ----------
-- Everyone (even anon) can read products
create policy "Products: public read"
  on public.products for select
  using (true);

-- Only managers can insert/update products
create policy "Products: manager insert"
  on public.products for insert
  with check (public.is_manager());

create policy "Products: manager update"
  on public.products for update
  using (public.is_manager());

-- ---------- queues ----------
-- Everyone can see which queue is active
create policy "Queues: public read"
  on public.queues for select
  using (true);

-- Only managers can write
create policy "Queues: manager insert"
  on public.queues for insert
  with check (public.is_manager());

create policy "Queues: manager update"
  on public.queues for update
  using (public.is_manager());

-- ---------- queue_items ----------
-- Everyone can read
create policy "Queue items: public read"
  on public.queue_items for select
  using (true);

-- Only managers can write
create policy "Queue items: manager insert"
  on public.queue_items for insert
  with check (public.is_manager());

create policy "Queue items: manager update"
  on public.queue_items for update
  using (public.is_manager());

create policy "Queue items: manager delete"
  on public.queue_items for delete
  using (public.is_manager());

-- ---------- recommendations ----------
-- Everyone can read current recommendation
create policy "Recommendations: public read"
  on public.recommendations for select
  using (true);

-- Only managers can write
create policy "Recommendations: manager insert"
  on public.recommendations for insert
  with check (public.is_manager());

create policy "Recommendations: manager update"
  on public.recommendations for update
  using (public.is_manager());

create policy "Recommendations: manager delete"
  on public.recommendations for delete
  using (public.is_manager());

-- ---------- orders ----------
-- Users can read only their own orders
create policy "Orders: read own"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users can insert their own orders
create policy "Orders: insert own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Only managers can update order status
create policy "Orders: manager update"
  on public.orders for update
  using (public.is_manager());

-- ---------- app_settings ----------
-- Everyone can read payment flags (needed to show/hide pay button)
create policy "App settings: public read"
  on public.app_settings for select
  using (true);

-- Only managers can update payment_enabled
create policy "App settings: manager update payment_enabled"
  on public.app_settings for update
  using (public.is_manager() and key = 'payment_enabled');

-- payment_super: NO policy for update → only service role (developer) can change it
-- (service role bypasses RLS entirely)

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- 4 queue slots
insert into public.queues (id, name, is_active, current_position) values
  (1, 'Queue #1', false, 1),
  (2, 'Queue #2', false, 1),
  (3, 'Queue #3', false, 1),
  (4, 'Queue #4', false, 1)
on conflict (id) do nothing;

-- App settings: both payment flags start OFF
insert into public.app_settings (key, value) values
  ('payment_super', false),
  ('payment_enabled', false)
on conflict (key) do nothing;

-- 8 sample products (AR + EN, with initials)
insert into public.products (name_en, name_ar, description_en, description_ar, price, initials) values
  ('Espresso',              'إسبريسو',         'Strong shot of coffee',            'جرعة قهوة قوية',              12.00, 'E'),
  ('Cappuccino',            'كابتشينو',        'Espresso with steamed milk foam',   'إسبريسو مع رغوة الحليب',     16.00, 'C'),
  ('Latte',                 'لاتيه',           'Espresso with steamed milk',        'إسبريسو مع الحليب الساخن',   18.00, 'L'),
  ('Almond Croissant',      'كرواسون اللوز',    'Buttery croissant with almonds',    'كرواسون طري باللوز',         14.00, 'AC'),
  ('Iced Americano',       'أمريكانو مثلج',    'Chilled espresso with water',       'إسبريسو بارد مع الماء',      15.00, 'IA'),
  ('Matcha Latte',          'لاتيه ماتشا',      'Matcha green tea with milk',        'ماتشا الشاي الأخضر مع الحليب', 22.00, 'ML'),
  ('Chocolate Muffin',     'كعكة الشوكولاتة',  'Soft chocolate muffin',             'كعكة شوكولاتة طرية',         10.00, 'CM'),
  ('Flat White',            'فلات وايت',        'Double shot with microfoam',        'جرعة مزدوجة مع رغوة دقيقة',   17.00, 'FW')
on conflict do nothing;

-- ============================================================
-- END OF MIGRATION
-- ============================================================