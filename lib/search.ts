import Fuse from 'fuse.js';

import type { Product } from '@/services/products';

// ---------- Types ----------

export interface SearchEntry {
  id: string;
  name_en: string;
  name_ar: string;
  real_name_en: string | null;
  real_name_ar: string | null;
  initials: string;
  aliases: string[];
}

// ---------- Helpers ----------

/** Build initials from the first letter of each word in name_en (uppercase). */
export function buildInitials(nameEn: string): string {
  return nameEn
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Known transliteration aliases for common coffee products. */
const ALIAS_MAP: Record<string, string[]> = {
  espresso: ['اسبريسو', 'اسبريسو', 'اكسبريسو'],
  cappuccino: ['كابتشينو', 'كابتشينو', 'كابوتشينو'],
  latte: ['لاتيه', 'لاتي', 'لاتيه'],
  'almond croissant': ['كرواسون اللوز', 'كروسان اللوز'],
  'iced americano': ['امريكانو مثلج', 'امريكانو بارد'],
  'matcha latte': ['ماتشا لاتيه', 'ماتشا'],
  'chocolate muffin': ['كعكة الشوكولاتة', 'مافن الشوكولاتة'],
  'flat white': ['فلات وايت', 'فلات وايت'],
};

function getAliases(product: Product): string[] {
  const key = product.name_en.toLowerCase();
  return ALIAS_MAP[key] ?? [];
}

/** Convert a Product[] into SearchEntry[] for the Fuse index. */
export function buildSearchEntries(products: Product[]): SearchEntry[] {
  return products.map((p) => ({
    id: p.id,
    name_en: p.name_en,
    name_ar: p.name_ar,
    real_name_en: p.real_name_en ?? null,
    real_name_ar: p.real_name_ar ?? null,
    initials: p.initials || buildInitials(p.name_en),
    aliases: getAliases(p),
  }));
}

// ---------- Fuse index ----------

/**
 * Create a Fuse search index over all products.
 *
 * Tuning notes:
 * - threshold 0.4 allows typo tolerance ("cappucino" → "Cappuccino")
 * - ignoreLocation true so matches anywhere in the string count
 * - minMatchCharLength 1 so short acronym queries like "ac" work
 * - includeScore true so we can filter out very bad matches
 * - keys with different weights: initials gets highest weight so
 *   acronym search ("AC" → Almond Croissant) takes priority
 */
export function createSearchIndex(products: Product[]) {
  const entries = buildSearchEntries(products);

  const fuse = new Fuse(entries, {
    keys: [
      { name: 'initials', weight: 0.3 },
      { name: 'name_en', weight: 0.25 },
      { name: 'name_ar', weight: 0.15 },
      { name: 'real_name_en', weight: 0.15 },
      { name: 'real_name_ar', weight: 0.1 },
      { name: 'aliases', weight: 0.05 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
    isCaseSensitive: false,
  });

  return fuse;
}

// ---------- Search function ----------

/**
 * Search products by query string.
 * Handles:
 *  1. Fuzzy typo-tolerant match via Fuse
 *  2. Cross-language — index includes both name_en and name_ar
 *  3. Acronym — exact case-insensitive match on initials field
 *  4. Aliases — transliteration variants
 *
 * Returns matching Product[] from the provided products list.
 */
export function searchProducts(
  fuse: Fuse<SearchEntry>,
  query: string,
  allProducts: Product[]
): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowerQuery = trimmed.toLowerCase();

  // First: exact acronym match (case-insensitive)
  // e.g. "AC" or "ac" → initials "AC" → Almond Croissant
  const acronymMatches = allProducts.filter((p) => {
    const initials = p.initials || buildInitials(p.name_en);
    return initials.toLowerCase() === lowerQuery;
  });

  // Then: Fuse fuzzy search
  const fuseResults = fuse.search(trimmed);

  // Map fuse results back to Product objects
  const fuseMatches = fuseResults
    .filter((r) => r.score !== undefined && r.score <= 0.6)
    .map((r) => allProducts.find((p) => p.id === r.item.id))
    .filter(Boolean) as Product[];

  // Merge: acronym matches first, then fuse matches, deduplicated
  const seen = new Set<string>();
  const merged: Product[] = [];

  for (const p of acronymMatches) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  for (const p of fuseMatches) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }

  return merged;
}