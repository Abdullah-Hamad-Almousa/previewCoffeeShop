import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { Product } from '@/services/products';

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const name = isAr ? product.name_ar : product.name_en;

  return (
    <Pressable style={styles.card} onPress={() => onPress(product.id)}>
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{product.initials}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.price}>
        {product.price.toFixed(2)} {t('products.currency')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
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
    backgroundColor: '#F5F5F7',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});