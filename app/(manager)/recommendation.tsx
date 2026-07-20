import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  getProducts,
  setRecommendationToday,
  getCurrentRecommendation,
  type Product,
  type Recommendation,
} from '@/services/products';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles, colors } from '@/lib/theme';

export default function RecommendationScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();

  const [products, setProducts] = useState<Product[]>([]);
  const [currentRec, setCurrentRec] = useState<Recommendation | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getCurrentRecommendation()])
      .then(([prods, rec]) => {
        setProducts(prods);
        setCurrentRec(rec);
        if (rec) {
          const p = prods.find((x) => x.id === rec.product_id);
          setCurrentProduct(p ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePick = useCallback(async (productId: string) => {
    setSetting(true);
    try {
      await setRecommendationToday(productId);
      const rec = await getCurrentRecommendation();
      setCurrentRec(rec);
      const p = products.find((x) => x.id === productId);
      setCurrentProduct(p ?? null);
      Alert.alert(t('manager.recommendationSet'));
    } catch (err: any) {
      Alert.alert(t('manager.recommendationFailed'), err?.message ?? '');
    } finally {
      setSetting(false);
    }
  }, [products, t]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('manager.title')} />

      <Text style={styles.title}>{t('manager.recommendationToday')}</Text>

      {/* Current recommendation */}
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>{t('manager.currentRecommendation')}</Text>
        {currentRec && currentProduct ? (
          <View style={styles.currentItem}>
            <View style={styles.imageWrap}>
              <ProductImage
                product={currentProduct}
                style={styles.image}
                placeholderFontSize={16}
                placeholderBg={colors.bgGray}
              />
            </View>
            <View>
              <Text style={styles.currentName}>
                {getProductName(currentProduct, isAr)}
              </Text>
              <Text style={styles.currentPrice}>
                {currentProduct.price.toFixed(2)} {t('products.currency')}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noCurrent}>{t('manager.noCurrentRecommendation')}</Text>
        )}
      </View>

      {/* Product picker list */}
      <Text style={styles.pickerLabel}>{t('manager.pickProduct')}</Text>

      {loading ? (
        <LoadingSpinner />
      ) : (
        products.map((product) => (
          <Pressable
            key={product.id}
            style={[
              styles.productRow,
              currentRec?.product_id === product.id && styles.productRowActive,
            ]}
            onPress={() => handlePick(product.id)}
            disabled={setting}
          >
            <View style={styles.imageWrap}>
              <ProductImage
                product={product}
                style={styles.image}
                placeholderFontSize={16}
                placeholderBg={colors.bgGray}
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{getProductName(product, isAr)}</Text>
              <Text style={styles.productPrice}>
                {product.price.toFixed(2)} {t('products.currency')}
              </Text>
            </View>
            {currentRec?.product_id === product.id && (
              <Text style={styles.activeBadge}>✓</Text>
            )}
          </Pressable>
        ))
      )}

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  currentCard: {
    backgroundColor: colors.bgLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  currentLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  currentItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageWrap: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  currentName: { fontSize: 16, fontWeight: '600' },
  currentPrice: { fontSize: 14, color: colors.primary, marginTop: 2 },
  noCurrent: { fontSize: 15, color: colors.textMid },
  pickerLabel: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    marginBottom: 6,
  },
  productRowActive: {
    borderColor: colors.success,
    backgroundColor: '#F0FBF4',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '500' },
  productPrice: { fontSize: 14, color: colors.primary, marginTop: 2 },
  activeBadge: { fontSize: 18, color: colors.success, fontWeight: 'bold' },
});