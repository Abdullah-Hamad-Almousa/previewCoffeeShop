import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getProduct, type Product } from '@/services/products';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function ProductDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('nav.home')}</Text>
        </Pressable>
      </View>
    );
  }

  const isAr = i18n.language === 'ar';
  const name = isAr ? product.name_ar : product.name_en;
  const description = isAr ? product.description_ar : product.description_en;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <LanguageToggle />
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ {t('nav.home')}</Text>
      </Pressable>

      {/* Product image */}
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{product.initials}</Text>
          </View>
        )}
      </View>

      {/* Name + price */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>
        {product.price.toFixed(2)} {t('products.currency')}
      </Text>

      {/* Description */}
      {description ? (
        <View style={styles.descSection}>
          <Text style={styles.descLabel}>{t('products.description')}</Text>
          <Text style={styles.descText}>{description}</Text>
        </View>
      ) : null}

      {/* Pay entry point — routes to payment screen */}
      <Pressable
        style={styles.payButton}
        onPress={() => router.push(`/(customer)/payment/${product.id}`)}
      >
        <Text style={styles.payButtonText}>{t('products.pay')}</Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  backButton: { marginBottom: 12 },
  backText: { fontSize: 16, color: '#007AFF' },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 48, fontWeight: 'bold', color: '#999' },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  price: { fontSize: 22, color: '#007AFF', fontWeight: '600', marginBottom: 20 },
  descSection: { marginBottom: 24 },
  descLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
  descText: { fontSize: 16, lineHeight: 24, color: '#333' },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  notFound: { fontSize: 18, color: '#666' },
  backLink: { fontSize: 16, color: '#007AFF' },
});