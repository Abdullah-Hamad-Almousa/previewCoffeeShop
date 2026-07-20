import { memo, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
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
  const [errored, setErrored] = useState(false);

  // Reset error state when URL changes
  useEffect(() => {
    setErrored(false);
  }, [product.image_url]);

  // Show image only if URL exists, looks valid, AND hasn't errored
  const url = product.image_url;
  const isValidUrl = url && url.startsWith('http') && !errored;

  if (isValidUrl) {
    return (
      <Image
        source={{ uri: url }}
        style={style}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => setErrored(true)}
      />
    );
  }

  // Fallback: initials placeholder
  return (
    <View style={[style, sharedStyles.placeholder, placeholderBg ? { backgroundColor: placeholderBg } : null]}>
      <Text style={[sharedStyles.placeholderText, { fontSize: placeholderFontSize }]}>
        {product.initials}
      </Text>
    </View>
  );
});