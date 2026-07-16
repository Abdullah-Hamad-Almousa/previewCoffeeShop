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
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useQueue } from '@/hooks/useQueue';
import { getProducts, type Product } from '@/services/products';
import { buildRandomQueue } from '@/services/queue';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Footer } from '@/components/Footer';

export default function QueueSectionScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { queues, queueItems, loading, start, saveItems, refresh } = useQueue();

  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const handleStart = async (queueId: number) => {
    if (!queueItems[queueId] || queueItems[queueId].length === 0) {
      Alert.alert(t('queue.emptyQueue'));
      return;
    }
    setBusy(queueId);
    try {
      await start(queueId);
      Alert.alert(t('queue.startSuccess'));
    } catch (err: any) {
      Alert.alert(t('queue.startFailed'), err?.message ?? '');
    } finally {
      setBusy(null);
    }
  };

  const handleRandom = async (queueId: number) => {
    if (products.length === 0) {
      Alert.alert(t('queue.randomFailed'), 'No products loaded');
      return;
    }
    setBusy(queueId);
    try {
      const randomIds = await buildRandomQueue(products);
      if (randomIds.length === 0) {
        Alert.alert(t('queue.randomFailed'), 'No products to shuffle');
        return;
      }
      await saveItems(queueId, randomIds);
      Alert.alert(t('queue.randomSuccess'));
    } catch (err: any) {
      Alert.alert(t('queue.randomFailed'), err?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('manager.title')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('manager.queueSection')}</Text>

      {queues.map((queue) => {
        const items = queueItems[queue.id] ?? [];
        const itemCount = items.length;

        return (
          <View key={queue.id} style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueName}>#{queue.id}</Text>
              <View style={[styles.badge, queue.is_active ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeText}>
                  {queue.is_active ? t('queue.active') : t('queue.inactive')}
                </Text>
              </View>
            </View>

            <Text style={styles.itemCount}>
              {itemCount > 0 ? `${itemCount} ${t('queue.items')}` : t('queue.noItems')}
            </Text>

            {/* Show first 3 product names */}
            {items.length > 0 && (
              <View style={styles.previewList}>
                {items.slice(0, 3).map((item, idx) => {
                  const p = products.find((x) => x.id === item.product_id);
                  return (
                    <Text key={item.id} style={styles.previewItem} numberOfLines={1}>
                      {idx + 1}. {p ? (isAr ? p.name_ar : p.name_en) : '...'}
                    </Text>
                  );
                })}
                {items.length > 3 && (
                  <Text style={styles.previewMore}>+{items.length - 3}</Text>
                )}
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.actionBtn, styles.startBtn, (busy === queue.id || itemCount === 0) && styles.btnDisabled]}
                onPress={() => handleStart(queue.id)}
                disabled={busy === queue.id || itemCount === 0}
              >
                <Text style={styles.actionBtnText}>{t('queue.start')}</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => router.push(`/(manager)/queue-edit/${queue.id}`)}
              >
                <Text style={styles.actionBtnText}>{t('queue.edit')}</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.randomBtn, busy === queue.id && styles.btnDisabled]}
                onPress={() => handleRandom(queue.id)}
                disabled={busy === queue.id}
              >
                <Text style={styles.actionBtnText}>{t('queue.random')}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  queueCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  queueName: { fontSize: 20, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#34C759' },
  badgeInactive: { backgroundColor: '#E5E5EA' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  itemCount: { fontSize: 14, color: '#666', marginBottom: 6 },
  previewList: { gap: 2, marginBottom: 8 },
  previewItem: { fontSize: 13, color: '#555' },
  previewMore: { fontSize: 13, color: '#999' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  startBtn: { backgroundColor: '#34C759' },
  editBtn: { backgroundColor: '#007AFF' },
  randomBtn: { backgroundColor: '#FF9500' },
  btnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});