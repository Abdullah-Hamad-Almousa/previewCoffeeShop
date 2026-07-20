-- ============================================================
-- Migration 006: Mystic Coffee Products
-- ============================================================
-- 1. Add real_name columns
-- 2. Rename 4 matching products (keep UUID so reviews/orders survive)
-- 3. Delete 4 non-matching products (cascade removes reviews/orders)
-- 4. Insert 8 new products (6 drinks + 2 food)
-- Idempotent — safe to run multiple times.
-- ============================================================

-- 1. Add real_name columns
alter table public.products add column if not exists real_name_en text;
alter table public.products add column if not exists real_name_ar text;

-- 2. RENAME matching products (keep UUID so reviews/orders survive)
update public.products set
  name_en = 'Moonlit Mocha',
  name_ar = 'موكا القمرية',
  description_en = 'Espresso with chocolate and steamed milk',
  description_ar = 'إسبريسو مع الشوكولاتة والحليب الساخن',
  real_name_en = 'Mocha',
  real_name_ar = 'موكا',
  initials = 'MM'
where name_en = 'Latte';

update public.products set
  name_en = 'Gearwork Espresso',
  name_ar = 'إسبريسو جير وورك',
  description_en = 'Double espresso (doppio) — pure and precise',
  description_ar = 'إسبريسو مزدوج (دوبيو) — نقي ودقيق',
  real_name_en = 'Double Espresso',
  real_name_ar = 'إسبريسو مزدوج',
  initials = 'GE'
where name_en = 'Espresso';

update public.products set
  name_en = 'Whispering Cloud',
  name_ar = 'الغيمة المهمسة',
  description_en = 'Espresso with thick steamed milk foam',
  description_ar = 'إسبريسو مع رغوة حليب كثيفة',
  real_name_en = 'Cappuccino',
  real_name_ar = 'كابتشينو',
  initials = 'WC'
where name_en = 'Cappuccino';

update public.products set
  name_en = 'Midnight Ember',
  name_ar = 'جمر منتصف الليل',
  description_en = 'Black as midnight with the warm glow of crema',
  description_ar = 'أسود كمنتصف الليل مع توهج الكريما الدافئ',
  real_name_en = 'Americano',
  real_name_ar = 'أمريكانو',
  initials = 'ME'
where name_en = 'Iced Americano';

-- 3. DELETE non-matching products (cascade removes reviews + orders)
delete from public.products where name_en in (
  'Almond Croissant',
  'Matcha Latte',
  'Chocolate Muffin',
  'Flat White'
);

-- 4. INSERT 8 new products (6 drinks + 2 food)
insert into public.products (name_en, name_ar, description_en, description_ar, price, initials, real_name_en, real_name_ar) values
  ('Riverstone Latte', 'لاتيه ريفرستون', 'Smooth vanilla latte with oat or regular milk', 'لاتيه فانيلا ناعم بحليب الشوفان أو العادي', 20.00, 'RL', 'Vanilla Latte', 'لاتيه فانيلا'),
  ('Foggy Grove', 'فوجي جروف', 'Slow-brewed overnight, served with a mist', 'مخمور ببطء طوال الليل، يقدم مع ضباب خفيف', 16.00, 'FG', 'Cold Brew', 'قهوة باردة'),
  ('Copper Cauldron Chai', 'تشاي الكادر النحاسي', 'Spiced chai simmered to perfection', 'تشاي بالبهارات يغلى بإتقان', 22.00, 'CC', 'Chai Latte', 'لاتيه تشاي'),
  ('Dam Good Drip', 'دام جود دريب', 'The honest classic filter coffee', 'القهوة الكلاسيكية الصادقة', 10.00, 'DD', 'Drip Coffee', 'قهوة فيلتر'),
  ('Enchanted Snowcap', 'إنتشانتد سنو كاب', 'Iced caramel macchiato with a snow-capped drizzle', 'ماكياتو كراميل مثلج مع رذاذ كالثلج', 24.00, 'ES', 'Iced Caramel Macchiato', 'ماكياتو كراميل مثلج'),
  ('Potion No. 9', 'الوصفة رقم 9', 'The mystery drink of the day — rotating recipe', 'مشروب اليوم الغامض — وصفة متغيرة', 25.00, 'P9', 'Daily Special', 'مشروب اليوم'),
  ('Ember Crumble', 'إمبر كرامبل', 'Dark chocolate croissant, warm and crumbly', 'كرواسون الشوكولاتة الداكنة، دافئ ومفتفت', 14.00, 'EC', 'Chocolate Croissant', 'كرواسون الشوكولاتة'),
  ('Honeyglow Scone', 'هاني جلو سكون', 'Honey butter scone with a golden glow', 'سكون العسل والزبدة بتوهج ذهبي', 12.00, 'HS', 'Honey Scone', 'سكون العسل')
on conflict do nothing;

-- ============================================================
-- END OF MIGRATION 006
-- ============================================================