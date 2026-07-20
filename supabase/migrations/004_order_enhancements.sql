-- ============================================================
-- Migration 004: Order Enhancements (pickup time, delivery location, free orders)
-- ============================================================
-- ADDITIVE only. Safe to run multiple times (idempotent).
-- ============================================================

-- 1. Add 'ordered' to the orders status check constraint
--    Current: status in ('pending', 'paid', 'failed', 'refunded')
--    New:    status in ('pending', 'paid', 'failed', 'refunded', 'ordered')
do $$
begin
  alter table public.orders drop constraint if exists orders_status_check;
  alter table public.orders add constraint orders_status_check
    check (status in ('pending', 'paid', 'failed', 'refunded', 'ordered'));
exception when others then
  null;
end;
$$;

-- 2. Add pickup_time column (when customer wants the order)
alter table public.orders add column if not exists pickup_time timestamptz;

-- 3. Add delivery_location columns (random Riyadh location)
alter table public.orders add column if not exists delivery_area text;
alter table public.orders add column if not exists delivery_lat numeric(10, 7);
alter table public.orders add column if not exists delivery_lng numeric(10, 7);

-- 4. Update has_purchased() to also count 'ordered' status (free orders count as purchases)
create or replace function public.has_purchased(p_product_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where user_id = auth.uid()
      and product_id = p_product_id
      and status in ('paid', 'ordered')
  );
$$;

-- ============================================================
-- END OF MIGRATION 004
-- ============================================================