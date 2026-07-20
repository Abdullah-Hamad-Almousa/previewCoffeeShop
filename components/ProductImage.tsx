import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { ImageStyle } from 'react-native';

import type { Product } from '@/services/products';
import { sharedStyles } from '@/lib/theme';

interface ProductImageProps {
  product: Pick<Product, 'image_url' | 'initials'>;
  style: ImageStyle;
  placeholderFontSize?: number;
  placeholderBg?: string;
}

/** Product image with initials placeholder fallback */
export const ProductImage = memo(function ProductImage({
  product,
  style,
  placeholderFontSize = 32,
  placeholderBg,
}: ProductImageProps) {
  if (product.image_url) {
    return <Image source={{ uri: product.image_url }} style={style} contentFit="cover" />;
  }

  return (
    <View style={[style, sharedStyles.placeholder, placeholderBg ? { backgroundColor: placeholderBg } : null]}>
      <Text style={[sharedStyles.placeholderText, { fontSize: placeholderFontSize }]}>
        {product.initials}
      </Text>
    </View>
  );
});