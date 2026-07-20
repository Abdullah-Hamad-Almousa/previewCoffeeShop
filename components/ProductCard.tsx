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
      {/* Image — wide, takes top portion of the card */}
      <View style={styles.imageWrap}>
        <ProductImage
          product={product}
          style={styles.image}
          placeholderFontSize={36}
          placeholderBg={colors.bgLight}
        />
        {/* Gear accent in corner */}
        <View style={styles.gearBadge}>
          <Text style={styles.gearEmoji}>⚙️</Text>
        </View>
      </View>

      {/* Content section */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {getProductName(product, isAr)}
        </Text>
        {getProductRealName(product, isAr) && (
          <Text style={styles.realName} numberOfLines={1}>
            {getProductRealName(product, isAr)}
          </Text>
        )}
        <View style={styles.bottomRow}>
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
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.6,
    overflow: 'hidden',
    backgroundColor: colors.bgLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gearBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(26, 20, 16, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearEmoji: {
    fontSize: 16,
  },
  content: {
    padding: 14,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textLight,
  },
  realName: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    color: colors.brass,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 12,
    color: colors.rating,
    letterSpacing: -1,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});