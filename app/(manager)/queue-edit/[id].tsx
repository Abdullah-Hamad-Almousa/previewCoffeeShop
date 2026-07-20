import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getProducts, type Product } from '@/services/products';
import { getQueueItems, type QueueItem } from '@/services/queue';
import { useQueue } from '@/hooks/useQueue';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProductImage } from '@/components/ProductImage';
import { Footer } from '@/components/Footer';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles, colors } from '@/lib/theme';

export default function QueueEditScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queueId = Number(id);
  const { saveItems } = useQueue();

  const [products, setProducts] = useState<Product[]>([]);
  const [existingItems, setExistingItems] = useState<QueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getQueueItems(queueId)])
      .then(([prods, items]) => {
        setProducts(prods);
        setExistingItems(items);
        // Pre-fill selectedIds from existing items order
        setSelectedIds(items.map((item) => item.product_id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [queueId]);

  const handleAddProduct = useCallback((productId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  }, []);

  const handleRemoveAt = useCallback((index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveItems(queueId, selectedIds);
      Alert.alert(t('queue.saveSuccess'));
      router.back();
    } catch (err: any) {
      Alert.alert(t('queue.saveFailed'), err?.message ?? '');
    } finally {
      setSaving(false);
    }
  }, [queueId, saveItems, selectedIds, t]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const selectedProducts = useMemo(
    () => selectedIds.map((pid) => products.find((p) => p.id === pid)).filter(Boolean) as Product[],
    [selectedIds, products]
  );

  const availableProducts = useMemo(
    () => products.filter((p) => !selectedIds.includes(p.id)),
    [products, selectedIds]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={`${t('queue.title')} #${queueId}`} />

      <Text style={styles.title}>{t('queue.editQueue')} #{queueId}</Text>
      <Text style={styles.hint}>{t('queue.buildQueue')}</Text>

      {/* Queue Order — selected products in order */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('queue.queueOrder')}</Text>
        {selectedIds.length > 0 && (
          <Pressable onPress={handleClearAll}>
            <Text style={styles.clearAllText}>{t('queue.clearAll')}</Text>
          </Pressable>
        )}
      </View>

      {selectedProducts.length === 0 ? (
        <Text style={styles.emptyText}>{t('queue.emptyQueue')}</Text>
      ) : (
        <View style={styles.orderList}>
          {selectedProducts.map((product, index) => (
            <View key={`${product.id}-${index}`} style={styles.orderRow}>
              <Text style={styles.orderPosition}>{index + 1}</Text>
              <View style={styles.orderImageWrap}>
                <ProductImage
                  product={product}
                  style={styles.orderImage}
                  placeholderFontSize={14}
                  placeholderBg={colors.bgGray}
                />
              </View>
              <Text style={styles.orderName} numberOfLines={1}>
                {getProductName(product, isAr)}
              </Text>
              <Pressable onPress={() => handleRemoveAt(index)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Available products */}
      <Text style={styles.sectionTitle}>{t('manager.pickProduct')}</Text>

      {availableProducts.length === 0 ? (
        <Text style={styles.emptyText}>{t('queue.noItems')}</Text>
      ) : (
        <View style={styles.availableList}>
          {availableProducts.map((product) => (
            <Pressable
              key={product.id}
              style={styles.availableRow}
              onPress={() => handleAddProduct(product.id)}
            >
              <View style={styles.availImageWrap}>
                <ProductImage
                  product={product}
                  style={styles.availImage}
                  placeholderFontSize={14}
                  placeholderBg={colors.bgGray}
                />
              </View>
              <View style={styles.availInfo}>
                <Text style={styles.availName}>{getProductName(product, isAr)}</Text>
                <Text style={styles.availPrice}>
                  {product.price.toFixed(2)} {t('products.currency')}
                </Text>
              </View>
              <Text style={styles.addText}>+</Text>
            </Pressable>
          ))}
        </View>
      )}
      {/* Save button */}
      <Pressable
        style={[sharedStyles.primaryBtn, styles.saveButton, (saving || selectedIds.length === 0) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || selectedIds.length === 0}
      >
        <Text style={sharedStyles.primaryBtnText}>
          {saving ? t('manager.saving') : t('queue.save')}
        </Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  hint: { fontSize: 14, color: colors.textMid, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  clearAllText: { fontSize: 14, color: colors.danger },
  emptyText: { fontSize: 14, color: colors.textMuted, marginBottom: 12, fontStyle: 'italic' },
  orderList: { gap: 6, marginBottom: 20 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF4',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  orderPosition: { fontSize: 16, fontWeight: 'bold', color: colors.success, width: 24 },
  orderImageWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  orderImage: { width: '100%', height: '100%' },
  orderName: { flex: 1, fontSize: 15, fontWeight: '500' },
  removeBtn: { padding: 6 },
  removeText: { fontSize: 16, color: colors.danger },
  availableList: { gap: 6, marginBottom: 20 },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  availImageWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  availImage: { width: '100%', height: '100%' },
  availInfo: { flex: 1 },
  availName: { fontSize: 15, fontWeight: '500' },
  availPrice: { fontSize: 13, color: colors.primary, marginTop: 2 },
  addText: { fontSize: 22, color: colors.success, fontWeight: 'bold' },
  saveButton: { marginBottom: 24 },
  saveButtonDisabled: { opacity: 0.4 },
});