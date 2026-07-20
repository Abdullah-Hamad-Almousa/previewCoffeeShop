import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { useRecommendation } from '@/hooks/useRecommendation';
import { useProducts } from '@/hooks/useProducts';
import { useIsAr, getProductName } from '@/lib/helpers';
import { Footer } from '@/components/Footer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CustomerHome() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { user, role } = useAuth();
  const { data: recommendation } = useRecommendation();
  const { products, loading, error } = useProducts();

  const handlePressProduct = useCallback((id: string) => {
    router.push(`/(customer)/product/${id}`);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero section — first thing user sees */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('home.heroSubtitle')}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{t('home.heroTagline')}</Text>
        </View>
      </View>

      <ScreenHeader />

      {/* Welcome card — user greeting + location + version */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          {user ? `${t('auth.welcome')}, ${user.username}` : t('home.welcome')}
        </Text>
        <Text style={styles.welcomeDesc}>{t('home.appDescription')}</Text>
        <View style={styles.welcomeMetaRow}>
          <Text style={styles.welcomeMeta}>📍 {t('home.currentLocation')}</Text>
          <Text style={styles.welcomeMeta}>{t('app.version')}</Text>
        </View>
      </View>

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
              <ProductImage
                product={recommendation.product}
                style={styles.recImage}
                placeholderFontSize={28}
                placeholderBg="#F5F5F7"
              />
            </View>
            <View style={styles.recInfo}>
              <Text style={styles.recName} numberOfLines={2}>
                {getProductName(recommendation.product, isAr)}
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
        <LoadingSpinner fullScreen={false} />
      ) : error ? (
        <Text style={styles.errorText}>{t('products.loadError')}</Text>
      ) : products.length === 0 ? (
        <Text style={styles.emptyText}>{t('products.notFound')}</Text>
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          estimatedItemSize={200}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.gridCell}>
              <ProductCard key={item.id} product={item} onPress={handlePressProduct} />
            </View>
          )}
        />
      )}

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroBadge: {
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  welcomeDesc: { fontSize: 15, color: '#666', lineHeight: 22, marginBottom: 12 },
  welcomeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeMeta: { fontSize: 13, color: '#999' },
  authRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  authLink: { fontSize: 15, color: '#007AFF' },
  authLinkManager: { fontSize: 15, color: '#FF9500', fontWeight: '600' },
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
  recInfo: { flex: 1, gap: 4 },
  recName: { fontSize: 18, fontWeight: '600', color: '#333' },
  recPrice: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  // Product grid
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  grid: {
    padding: 4,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  errorText: { fontSize: 15, color: '#FF3B30', textAlign: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center', marginTop: 40 },
});