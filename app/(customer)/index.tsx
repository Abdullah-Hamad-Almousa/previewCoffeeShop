import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useRecommendation } from '@/hooks/useRecommendation';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { getProducts, type Product } from '@/services/products';

export default function CustomerHome() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user, role } = useAuth();
  const { data: recommendation } = useRecommendation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const handlePressProduct = (id: string) => {
    router.push(`/(customer)/product/${id}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LanguageToggle />
      </View>

      <Text style={styles.welcome}>
        {user ? `${t('auth.welcome')}, ${user.username}` : t('home.welcome')}
      </Text>

      {/* Auth links when not logged in */}
      {!user && (
        <View style={styles.authRow}>
          <Pressable onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.authLink}>{t('auth.signIn')}</Text>
          </Pressable>
          <Text style={styles.divider}>·</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.authLink}>{t('auth.signUp')}</Text>
          </Pressable>
        </View>
      )}

      {/* Auth links when logged in — only settings + manager */}
      {user && (
        <View style={styles.authRow}>
          {role === 'manager' && (
            <>
              <Pressable onPress={() => router.push('/(manager)')}>
                <Text style={styles.authLinkManager}>{t('manager.title')}</Text>
              </Pressable>
              <Text style={styles.divider}>·</Text>
            </>
          )}
          <Pressable onPress={() => router.push('/(auth)/settings')}>
            <Text style={styles.authLink}>{t('nav.settings')}</Text>
          </Pressable>
        </View>
      )}

      {/* Search bar */}
      <SearchBar products={products} onSelectProduct={handlePressProduct} />

      {/* Recommendation Today — only shows if there's an active recommendation */}
      {recommendation && (
        <Pressable
          style={styles.recCard}
          onPress={() => handlePressProduct(recommendation.product.id)}
        >
          <View style={styles.recBadge}>
            <Text style={styles.recBadgeText}>{t('home.todaysPick')} ⭐</Text>
          </View>
          <View style={styles.recContent}>
            <View style={styles.recImageWrap}>
              {recommendation.product.image_url ? (
                <Image
                  source={{ uri: recommendation.product.image_url }}
                  style={styles.recImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.recImage, styles.recPlaceholder]}>
                  <Text style={styles.recPlaceholderText}>
                    {recommendation.product.initials}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.recInfo}>
              <Text style={styles.recName} numberOfLines={2}>
                {isAr ? recommendation.product.name_ar : recommendation.product.name_en}
              </Text>
              <Text style={styles.recPrice}>
                {recommendation.product.price.toFixed(2)} {t('products.currency')}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Product grid */}
      <Text style={styles.sectionTitle}>{t('products.title')}</Text>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{t('products.loadError')}</Text>
      ) : products.length === 0 ? (
        <Text style={styles.emptyText}>{t('products.notFound')}</Text>
      ) : (
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onPress={handlePressProduct} />
          ))}
        </View>
      )}

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  welcome: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  authRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  authLink: { fontSize: 15, color: '#007AFF' },
  authLinkManager: { fontSize: 15, color: '#FF9500', fontWeight: '600' },
  signOutLink: { fontSize: 15, color: '#FF3B30' },
  divider: { fontSize: 15, color: '#ccc' },
  // Recommendation card
  recCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  recBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recBadgeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  recContent: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  recImageWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  recImage: { width: '100%', height: '100%' },
  recPlaceholder: {
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recPlaceholderText: { fontSize: 28, fontWeight: 'bold', color: '#999' },
  recInfo: { flex: 1, gap: 4 },
  recName: { fontSize: 18, fontWeight: '600', color: '#333' },
  recPrice: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  // Product grid
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loader: { marginTop: 40 },
  errorText: { fontSize: 15, color: '#FF3B30', textAlign: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center', marginTop: 40 },
});