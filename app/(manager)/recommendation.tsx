import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import {
  getProducts,
  setRecommendationToday,
  getCurrentRecommendation,
  type Product,
  type Recommendation,
} from '@/services/products';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Footer } from '@/components/Footer';

export default function RecommendationScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

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

  const handlePick = async (productId: string) => {
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
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('manager.title')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('manager.recommendationToday')}</Text>

      {/* Current recommendation */}
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>{t('manager.currentRecommendation')}</Text>
        {currentRec && currentProduct ? (
          <View style={styles.currentItem}>
            <View style={styles.imageWrap}>
              {currentProduct.image_url ? (
                <Image source={{ uri: currentProduct.image_url }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Text style={styles.placeholderText}>{currentProduct.initials}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.currentName}>
                {isAr ? currentProduct.name_ar : currentProduct.name_en}
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
        <ActivityIndicator size="large" style={styles.loader} />
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
              {product.image_url ? (
                <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Text style={styles.placeholderText}>{product.initials}</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{isAr ? product.name_ar : product.name_en}</Text>
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
  container: { flexGrow: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  currentCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  currentLabel: { fontSize: 13, color: '#999', marginBottom: 10 },
  currentItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageWrap: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
  currentName: { fontSize: 16, fontWeight: '600' },
  currentPrice: { fontSize: 14, color: '#007AFF', marginTop: 2 },
  noCurrent: { fontSize: 15, color: '#666' },
  pickerLabel: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  loader: { marginTop: 40 },
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
    borderColor: '#34C759',
    backgroundColor: '#F0FBF4',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '500' },
  productPrice: { fontSize: 14, color: '#007AFF', marginTop: 2 },
  activeBadge: { fontSize: 18, color: '#34C759', fontWeight: 'bold' },
});