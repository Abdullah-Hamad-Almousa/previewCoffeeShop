import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
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
import { BeaverBackground } from '@/components/BeaverBackground';
import { colors } from '@/lib/theme';

export default function CustomerHome() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { user, role } = useAuth();
  const { data: recommendation } = useRecommendation();
  const { products, loading, error, refresh } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const handlePressProduct = useCallback((id: string) => {
    router.push(`/(customer)/product/${id}`);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View style={styles.screenWrap}>
      <BeaverBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
            colors={[colors.brass]}
          />
        }
      >
        {/* Hero section — steampunk style */}
        <View style={styles.hero}>
          <Text style={styles.heroGear}>⚙️ 🦫 ⚙️</Text>
          <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('home.heroSubtitle')}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{t('home.heroTagline')}</Text>
          </View>
        </View>

        <ScreenHeader />

        {/* Welcome card — dark steampunk card */}
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

        {/* Auth links when logged in */}
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

        {/* Recommendation Today */}
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
                  placeholderBg={colors.bgLight}
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

        {/* Product list — single column, full-width tall cards */}
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
            numColumns={1}
            estimatedItemSize={320}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <ProductCard key={item.id} product={item} onPress={handlePressProduct} />
            )}
          />
        )}

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scroll: {
    flex: 1,
  },
  container: { flexGrow: 1, padding: 16 },
  // Hero — steampunk
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 8,
  },
  heroGear: {
    fontSize: 20,
    marginBottom: 12,
    letterSpacing: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.brass,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 17,
    color: colors.textMid,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroBadge: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  // Welcome card
  welcomeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: colors.textLight },
  welcomeDesc: { fontSize: 15, color: colors.textMid, lineHeight: 22, marginBottom: 12 },
  welcomeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeMeta: { fontSize: 13, color: colors.textMuted },
  authRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  authLink: { fontSize: 15, color: colors.brass },
  authLinkManager: { fontSize: 15, color: colors.accent, fontWeight: '600' },
  divider: { fontSize: 15, color: colors.borderLight },
  // Recommendation card
  recCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  recBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.brass,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recBadgeText: { fontSize: 12, fontWeight: '700', color: colors.bgDark },
  recContent: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  recImageWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden' },
  recImage: { width: '100%', height: '100%' },
  recInfo: { flex: 1, gap: 4 },
  recName: { fontSize: 18, fontWeight: '600', color: colors.textLight },
  recPrice: { fontSize: 16, color: colors.brass, fontWeight: '500' },
  // Product list
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.textLight },
  grid: {
    padding: 4,
  },
  errorText: { fontSize: 15, color: colors.danger, textAlign: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});