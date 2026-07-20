# Order Enhancements Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add four features to Preview Coffee Shop: (1) pickup time for orders, (2) "Order Now" button for free orders without payment, (3) random Riyadh delivery location on each order, (4) welcome section on home page with app description + location + version.

**Architecture:** New `orders` screen for free orders (no payment), new migration to add columns + status to orders table, new service layer for free orders, random Riyadh location generator utility, modified home page and product detail page. All bilingual (AR/EN + RTL).

**Tech Stack:** Expo 57, expo-router, Supabase, i18next, React Native

---

## Overview of Changes

### Current flow:
Product detail → "Pay" button → Payment screen → creates order (status='paid') via edge function

### New flow (both coexist):
- Product detail → "Pay" button → Payment screen (unchanged)
- Product detail → "Order Now" button → **New Order screen** → picks time + auto-generates random Riyadh location → creates order (status='ordered', no payment)

---

## Task 1: Migration 004 — Add order columns + 'ordered' status

**Objective:** Add pickup_time, delivery_location columns to orders table. Add 'ordered' status. Update has_purchased() to count free orders.

**Files:**
- Create: `supabase/migrations/004_order_enhancements.sql`

```sql
-- ============================================================
-- Migration 004: Order Enhancements (pickup time, delivery location, free orders)
-- ============================================================
-- ADDITIVE only. Safe to run multiple times.
-- ============================================================

-- 1. Add 'ordered' to the orders status check constraint
--    Current constraint: status in ('pending', 'paid', 'failed', 'refunded')
--    New constraint adds 'ordered' for free orders (no payment)
do $$
begin
  -- Drop old constraint if exists, add new one
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
```

**Verification:** Run the migration in Supabase SQL Editor. Check `\d public.orders` shows new columns. Test `has_purchased()` returns true for a row with status='ordered'.

---

## Task 2: Create Riyadh locations utility

**Objective:** Array of ~15 real Riyadh districts with lat/lng + a function to pick a random one.

**Files:**
- Create: `lib/riyadh-locations.ts`

```typescript
// Random Riyadh locations for order delivery address generation

export interface RiyadhArea {
  name_en: string;
  name_ar: string;
  lat: number;
  lng: number;
}

// ~15 real Riyadh districts/areas with approximate coordinates
export const RIYADH_AREAS: RiyadhArea[] = [
  { name_en: 'Olaya', name_ar: 'العليا', lat: 24.6877, lng: 46.6857 },
  { name_en: 'Al Malqa', name_ar: 'الملقا', lat: 24.8253, lng: 46.6454 },
  { name_en: 'King Fahd District', name_ar: 'حي الملك فهد', lat: 24.7136, lng: 46.6753 },
  { name_en: 'Al Murabba', name_ar: 'المربعة', lat: 24.6489, lng: 46.7097 },
  { name_en: 'Al Zahra', name_ar: 'الزهرة', lat: 24.6639, lng: 46.7286 },
  { name_en: 'Al Nakheel', name_ar: 'النخيل', lat: 24.7544, lng: 46.6306 },
  { name_en: 'Al Mohammadiyyah', name_ar: 'المحمدية', lat: 24.7533, lng: 46.5939 },
  { name_en: 'Al Sulaimaniya', name_ar: 'السليمانية', lat: 24.6891, lng: 46.6083 },
  { name_en: 'Al Batha', name_ar: 'البطحاء', lat: 24.6494, lng: 46.7253 },
  { name_en: 'Diriyah', name_ar: 'الدرعية', lat: 24.7544, lng: 46.5722 },
  { name_en: 'Namar', name_ar: 'نمار', lat: 24.5800, lng: 46.6500 },
  { name_en: 'Al Shifa', name_ar: 'الشفا', lat: 24.5500, lng: 46.6800 },
  { name_en: 'Al Qairawan', name_ar: 'القيراون', lat: 24.7800, lng: 46.6500 },
  { name_en: 'Al Yasmin', name_ar: 'الياسمين', lat: 24.8300, lng: 46.6700 },
  { name_en: 'An Nakheel', name_ar: 'النخيل', lat: 24.7544, lng: 46.6306 },
];

/** Pick a random Riyadh area for the order delivery location */
export function getRandomRiyadhArea(): RiyadhArea {
  const idx = Math.floor(Math.random() * RIYADH_AREAS.length);
  return RIYADH_AREAS[idx];
}
```

**Verification:** Import in a test file and call `getRandomRiyadhArea()` — should return a valid area with all 4 fields.

---

## Task 3: Create orders service

**Objective:** Service layer for creating free orders (no payment) with pickup time + delivery location.

**Files:**
- Create: `services/orders.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { RiyadhArea } from '@/lib/riyadh-locations';

export interface OrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

export type PickupSlot = 'asap' | '30min' | '1hour' | 'custom';

/**
 * Calculate the pickup time ISO string from a slot choice.
 * - asap: now + 15 min
 * - 30min: now + 30 min
 * - 1hour: now + 60 min
 * - custom: user-provided Date
 */
export function calcPickupTime(slot: PickupSlot, customDate?: Date): string {
  const now = new Date();
  if (slot === 'asap') return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  if (slot === '30min') return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  if (slot === '1hour') return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  return (customDate ?? now).toISOString();
}

/**
 * Create a FREE order (no payment). Inserts a row with status='ordered'.
 * The order includes pickup time + random Riyadh delivery location.
 */
export async function createFreeOrder(
  productId: string,
  pickupTime: string,
  deliveryArea: RiyadhArea
): Promise<OrderResult> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      product_id: productId,
      amount: 0, // free order
      status: 'ordered',
      pickup_time: pickupTime,
      delivery_area: isAr ? deliveryArea.name_ar : deliveryArea.name_en,
      delivery_lat: deliveryArea.lat,
      delivery_lng: deliveryArea.lng,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, orderId: data.id };
}
```

Wait — the insert needs `user_id`. Looking at the RLS policy: `"Orders: insert own"` checks `auth.uid() = user_id`. The orders table has `user_id not null`. But Supabase auto-fills? No — we need to provide user_id. Actually, looking at the existing createPayment edge function, it inserts with `user_id: userId` on the server side. For a client-side insert, we need to pass user_id.

Actually, Supabase doesn't auto-fill user_id. We need to get the current user and include it.

**Fix:** Update `createFreeOrder` to get the current user ID:

```typescript
import { supabase } from '@/lib/supabase';
import type { RiyadhArea } from '@/lib/riyadh-locations';
import { useIsAr } from '@/lib/helpers';

// ... (interfaces same as above)

export async function createFreeOrder(
  productId: string,
  pickupTime: string,
  deliveryArea: RiyadhArea,
  isAr: boolean
): Promise<OrderResult> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: productId,
      amount: 0,
      status: 'ordered',
      pickup_time: pickupTime,
      delivery_area: isAr ? deliveryArea.name_ar : deliveryArea.name_en,
      delivery_lat: deliveryArea.lat,
      delivery_lng: deliveryArea.lng,
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, orderId: data.id };
}
```

**Verification:** Call `createFreeOrder` with a test product ID, pickup time, and random area. Check Supabase dashboard — new order row with status='ordered', amount=0, pickup_time set, delivery_area filled.

---

## Task 4: i18n — Add new translation keys

**Objective:** Add bilingual keys for order screen, welcome section, and pickup time.

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/ar.json`

**en.json additions** (add after the "payment" block, before "manager"):

```json
"order": {
  "title": "Place Order",
  "orderNow": "Order Now",
  "pickupTime": "Pickup Time",
  "asap": "ASAP (15 min)",
  "in30min": "In 30 minutes",
  "in1hour": "In 1 hour",
  "custom": "Pick a time",
  "confirmOrder": "Confirm Order",
  "ordering": "Placing order...",
  "success": "Order Placed Successfully",
  "successMessage": "Your order has been placed (free)",
  "failed": "Failed to place order",
  "failedMessage": "Could not place your order",
  "deliveryLocation": "Delivery Location",
  "orderId": "Order ID",
  "done": "Done",
  "backToProduct": "Back to Product",
  "loginRequired": "Please sign in to place an order",
  "previewNote": "Preview app — no real delivery will be made"
},
"home": {
  "welcome": "Welcome to Preview Coffee Shop",
  "recommendationToday": "Recommendation Today",
  "noRecommendation": "No recommendation available",
  "todaysPick": "Recommend to you",
  "appDescription": "Order your favorite coffee and snacks. Preview mode — orders are free.",
  "currentLocation": "Current Location"
}
```

Note: The existing "home" block already has some keys. We're adding `appDescription` and `currentLocation` to it.

**ar.json additions** (same structure, Riyadh dialect):

```json
"order": {
  "title": "اطلب",
  "orderNow": "اطلب الحين",
  "pickupTime": "وقت الاستلام",
  "asap": "في الحال (15 دقيقة)",
  "in30min": "بعد 30 دقيقة",
  "in1hour": "بعد ساعة",
  "custom": "اختر وقت",
  "confirmOrder": "تأكيد الطلب",
  "ordering": "جاري الطلب...",
  "success": "تم الطلب بنجاح",
  "successMessage": "تم استلام طلبك (مجاناً)",
  "failed": "فشل الطلب",
  "failedMessage": "ما قدرنا نكمل طلبك",
  "deliveryLocation": "موقع التوصيل",
  "orderId": "رقم الطلب",
  "done": "تم",
  "backToProduct": "العودة للمنتج",
  "loginRequired": "سجّل دخولك عشان تطلب",
  "previewNote": "تطبيق تجريبي — ما راح يتم توصيل فعلي"
},
"home": {
  "welcome": "أهلاً بك في بريفيو كافيه",
  "recommendationToday": "ترشيح اليوم",
  "noRecommendation": "لا يوجد ترشيح متاح",
  "todaysPick": "نرشّح لك",
  "appDescription": "اطلب قهوتك ووجباتك الخفيفة المفضلة. وضع تجريبي — الطلبات مجانية.",
  "currentLocation": "موقعك الحالي"
}
```

**Verification:** Run `npx expo start --web` and toggle between EN/AR. All new keys render correctly.

---

## Task 5: Create Order screen

**Objective:** New route `app/(customer)/order/[productId].tsx` — shows product, pickup time selector, random Riyadh location, confirm button.

**Files:**
- Create: `app/(customer)/order/[productId].tsx`

Screen layout:
1. ScreenHeader with product name
2. Product summary (image + name + price)
3. Preview note (small warning that it's a preview)
4. Pickup time section — 4 Pressable buttons (ASAP, 30min, 1hour, custom). If custom, show a TextInput for HH:MM.
5. Delivery location section — shows a random Riyadh area name + coordinates. Button to regenerate ("🎲 Shuffle").
6. Confirm Order button → calls `createFreeOrder()` → success/failed screen
7. Success screen — order ID + done button → back to home

Key implementation details:
- Use `useProduct` hook (existing) to load product
- Use `useAuth` hook to check login
- Use `getRandomRiyadhArea()` on mount, store in state
- Use `useIsAr()` for language
- Use `sharedStyles` from `lib/theme`
- Use `ScreenHeader`, `ProductImage`, `LoadingSpinner`, `Footer` components
- Screen states: 'form' | 'processing' | 'success' | 'failed' (same pattern as payment screen)

```typescript
import { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { createFreeOrder, calcPickupTime, type PickupSlot } from '@/services/orders';
import { getRandomRiyadhArea, type RiyadhArea } from '@/lib/riyadh-locations';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles } from '@/lib/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';

type ScreenState = 'form' | 'processing' | 'success' | 'failed';

export default function OrderScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuth();
  const { product, loading } = useProduct(productId);

  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pickupSlot, setPickupSlot] = useState<PickupSlot>('asap');
  const [customTime, setCustomTime] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<RiyadhArea | null>(null);

  // Generate random location on mount
  useCallback(() => {
    setDeliveryArea(getRandomRiyadhArea());
  }, [])();

  const handleConfirm = async () => {
    if (!product || !user || !deliveryArea) return;
    setScreenState('processing');

    const pickupTime = calcPickupTime(pickupSlot, customTime ? new Date(customTime) : undefined);

    try {
      const result = await createFreeOrder(product.id, pickupTime, deliveryArea, isAr);
      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        setScreenState('success');
      } else {
        setScreenState('failed');
      }
    } catch {
      setScreenState('failed');
    }
  };

  // ... rest of screen (loading, not found, form, processing, success, failed)
  // Follow the exact same pattern as app/(customer)/payment/[productId].tsx
}
```

**Verification:** Navigate to `/(customer)/order/<productId>`. Screen loads, shows product, time buttons work, shuffle location works, confirm creates order in Supabase.

---

## Task 6: Modify product detail — add "Order Now" button

**Objective:** Add "Order Now" button next to the existing "Pay" button on the product detail page.

**Files:**
- Modify: `app/(customer)/product/[id].tsx:166-172`

**Current code (lines 166-172):**
```tsx
{/* Pay entry point — routes to payment screen */}
<Pressable
  style={styles.payButton}
  onPress={() => router.push(`/(customer)/payment/${product.id}`)}
>
  <Text style={styles.payButtonText}>{t('products.pay')}</Text>
</Pressable>
```

**New code:**
```tsx
{/* Order entry points — Pay + Order Now */}
<View style={styles.buttonRow}>
  <Pressable
    style={[styles.payButton, styles.buttonHalf]}
    onPress={() => router.push(`/(customer)/payment/${product.id}`)}
  >
    <Text style={styles.payButtonText}>{t('products.pay')}</Text>
  </Pressable>
  <Pressable
    style={[styles.orderButton, styles.buttonHalf]}
    onPress={() => router.push(`/(customer)/order/${product.id}`)}
  >
    <Text style={styles.orderButtonText}>{t('order.orderNow')}</Text>
  </Pressable>
</View>
```

**New styles to add in the StyleSheet:**
```typescript
buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
buttonHalf: { flex: 1 },
orderButton: {
  backgroundColor: '#34C759', // green = free
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: 'center',
},
orderButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
```

Remove the old `marginBottom: 24` from `payButton` since the row now handles spacing.

**Verification:** Open product detail — two buttons side by side. "Pay" (blue) and "Order Now" (green). "Order Now" navigates to the new order screen.

---

## Task 7: Modify home page — welcome section

**Objective:** Add a welcome section at the top of the home page with app description + current location + app version.

**Files:**
- Modify: `app/(customer)/index.tsx`

**Current welcome (lines 33-35):**
```tsx
<Text style={styles.welcome}>
  {user ? `${t('auth.welcome')}, ${user.username}` : t('home.welcome')}
</Text>
```

**New welcome section (replace lines 33-35):**
```tsx
{/* Welcome card — app description + location + version */}
<View style={styles.welcomeCard}>
  <Text style={styles.welcomeTitle}>
    {user ? `${t('auth.welcome')}, ${user.username}` : t('home.welcome')}
  </Text>
  <Text style={styles.welcomeDesc}>{t('home.appDescription')}</Text>
  <View style={styles.welcomeMetaRow}>
    <Text style={styles.welcomeMeta}>📍 {t('home.currentLocation')}: Riyadh</Text>
    <Text style={styles.welcomeMeta}>{t('app.version')}</Text>
  </View>
</View>
```

**New styles to add:**
```typescript
welcomeCard: {
  backgroundColor: '#F5F5F7',
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
},
welcomeTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
welcomeDesc: { fontSize: 15, color: '#666', lineHeight: 22, marginBottom: 12 },
welcomeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
welcomeMeta: { fontSize: 13, color: '#999' },
```

Remove the old `welcome` style since it's replaced by `welcomeTitle`.

**Verification:** Open home page — welcome card appears at top with description, location (Riyadh), and version. Toggle AR/EN — text updates.

---

## Task 8: Verify RLS policies allow client-side order insert

**Objective:** Confirm the existing RLS policy `"Orders: insert own"` allows the client to insert an order with status='ordered'.

**Analysis:**
- Migration 001 has: `create policy "Orders: insert own" on public.orders for insert with check (auth.uid() = user_id);`
- This policy does NOT restrict the status value — any authenticated user can insert any status.
- The `orders_status_check` constraint (updated in Task 1) allows 'ordered'.
- So yes, client-side insert works. No policy change needed.

**Verification:** After Task 5 is implemented, test by placing a free order from the app and checking Supabase dashboard.

---

## Summary of all files

| Action | Path |
|--------|------|
| Create | `supabase/migrations/004_order_enhancements.sql` |
| Create | `lib/riyadh-locations.ts` |
| Create | `services/orders.ts` |
| Create | `app/(customer)/order/[productId].tsx` |
| Modify | `locales/en.json` |
| Modify | `locales/ar.json` |
| Modify | `app/(customer)/product/[id].tsx` |
| Modify | `app/(customer)/index.tsx` |

## Risks / Tradeoffs

- **No payment verification for free orders**: Since free orders bypass the edge function, the client inserts directly. RLS ensures only authenticated users insert their own orders. The status check constraint allows 'ordered'. This is fine for a preview app.
- **has_purchased() update**: Free orders now count as purchases, so users can review products they ordered for free. This is intentional — the user "experienced" the product.
- **Random location is client-generated**: The delivery location is picked on the client and sent to Supabase. For a preview app this is fine. For production, the server should validate/assign the location.
- **No new dependencies**: All features use existing libraries (no new npm packages needed).

## Verification (end-to-end)

1. Run migration 004 in Supabase SQL Editor
2. `npx expo start`
3. Open app, sign in as AdminTest
4. Home page shows welcome card with description + Riyadh + version
5. Tap a product → see "Pay" (blue) and "Order Now" (green) buttons
6. Tap "Order Now" → order screen loads
7. Select pickup time, shuffle location, tap "Confirm Order"
8. Success screen shows order ID
9. Check Supabase dashboard → new order row with status='ordered', amount=0, pickup_time set, delivery_area filled
10. Go back, write a review on that product → should work (has_purchased now includes 'ordered')