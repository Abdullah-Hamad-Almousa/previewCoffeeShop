import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Product } from '@/services/products';
import { ProductImage } from '@/components/ProductImage';
import { useIsAr, getProductName, getProductRealName } from '@/lib/helpers';
import { colors } from '@/lib/theme';

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
}

/** Render star characters for a rating (e.g. 4.5 → "★★★★⯪") */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return '★'.repeat(full) + (hasHalf ? '⯨' : '') + '☆'.repeat(empty);
}

export const ProductCard = memo(function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const isAr = useIsAr();

  const hasRating = product.avg_rating != null && product.review_count != null && product.review_count > 0;

  return (
    <Pressable style={styles.card} onPress={() => onPress(product.id)}>
      <View style={styles.imageWrap}>
        <ProductImage
          product={product}
          style={styles.image}
          placeholderFontSize={32}
          placeholderBg={colors.bgLight}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {getProductName(product, isAr)}
      </Text>
      {getProductRealName(product, isAr) && (
        <Text style={styles.realName} numberOfLines={1}>
          {getProductRealName(product, isAr)}
        </Text>
      )}
      <Text style={styles.price}>
        {product.price.toFixed(2)} {t('products.currency')}
      </Text>
      {hasRating && (
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{renderStars(product.avg_rating!)}</Text>
          <Text style={styles.ratingText}>
            {product.avg_rating!.toFixed(1)} ({product.review_count})
          </Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.bgLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  realName: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: -4,
  },
  price: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 13,
    color: '#FF9500',
    letterSpacing: -1,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});