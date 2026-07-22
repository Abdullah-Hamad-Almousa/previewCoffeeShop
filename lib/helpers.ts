import { useTranslation } from 'react-i18next';
import type { Product } from '@/services/products';

/** Returns true if current language is Arabic */
export function useIsAr() {
  const { i18n } = useTranslation();
  return i18n.language === 'ar';
}

/** Get localized product name */
export function getProductName(product: Pick<Product, 'name_en' | 'name_ar'>, isAr: boolean) {
  return isAr ? product.name_ar : product.name_en;
}

/** Get localized product description */
export function getProductDesc(product: Pick<Product, 'description_en' | 'description_ar'>, isAr: boolean) {
  return isAr ? product.description_ar : product.description_en;
}

/** Get localized real-world product name (subtitle under Mystic name) */
export function getProductRealName(
  product: Pick<Product, 'real_name_en' | 'real_name_ar'>,
  isAr: boolean
) {
  const name = isAr ? product.real_name_ar : product.real_name_en;
  return name ?? null;
}

/** Render star characters for a rating (e.g. 4.5 → "★★★★⯨") */
export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return '★'.repeat(full) + (hasHalf ? '⯨' : '') + '☆'.repeat(empty);
}