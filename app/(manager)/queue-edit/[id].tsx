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
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getProducts, type Product } from '@/services/products';
import { getQueueItems, type QueueItem } from '@/services/queue';
import { useQueue } from '@/hooks/useQueue';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Footer } from '@/components/Footer';

export default function QueueEditScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
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

  const handleAddProduct = (productId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  };

  const handleRemoveAt = (index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
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
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const selectedProducts = selectedIds
    .map((pid) => products.find((p) => p.id === pid))
    .filter(Boolean) as Product[];

  const availableProducts = products.filter((p) => !selectedIds.includes(p.id));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('queue.title')} #{queueId}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

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
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.orderImage} contentFit="cover" />
                ) : (
                  <View style={[styles.orderImage, styles.placeholder]}>
                    <Text style={styles.placeholderText}>{product.initials}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderName} numberOfLines={1}>
                {isAr ? product.name_ar : product.name_en}
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
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.availImage} contentFit="cover" />
                ) : (
                  <View style={[styles.availImage, styles.placeholder]}>
                    <Text style={styles.placeholderText}>{product.initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.availInfo}>
                <Text style={styles.availName}>{isAr ? product.name_ar : product.name_en}</Text>
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
        style={[styles.saveButton, (saving || selectedIds.length === 0) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || selectedIds.length === 0}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t('manager.saving') : t('queue.save')}
        </Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  hint: { fontSize: 14, color: '#666', marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  clearAllText: { fontSize: 14, color: '#FF3B30' },
  emptyText: { fontSize: 14, color: '#999', marginBottom: 12, fontStyle: 'italic' },
  orderList: { gap: 6, marginBottom: 20 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF4',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  orderPosition: { fontSize: 16, fontWeight: 'bold', color: '#34C759', width: 24 },
  orderImageWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  orderImage: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, fontWeight: 'bold', color: '#999' },
  orderName: { flex: 1, fontSize: 15, fontWeight: '500' },
  removeBtn: { padding: 6 },
  removeText: { fontSize: 16, color: '#FF3B30' },
  availableList: { gap: 6, marginBottom: 20 },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  availImageWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  availImage: { width: '100%', height: '100%' },
  availInfo: { flex: 1 },
  availName: { fontSize: 15, fontWeight: '500' },
  availPrice: { fontSize: 13, color: '#007AFF', marginTop: 2 },
  addText: { fontSize: 22, color: '#34C759', fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});