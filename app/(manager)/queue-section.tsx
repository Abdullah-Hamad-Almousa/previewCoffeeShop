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
import { router } from 'expo-router';

import { useQueue } from '@/hooks/useQueue';
import { getProducts, type Product } from '@/services/products';
import { buildRandomQueue } from '@/services/queue';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles, colors } from '@/lib/theme';

export default function QueueSectionScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { queues, queueItems, loading, start, saveItems, refresh } = useQueue();

  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const handleStart = useCallback(async (queueId: number) => {
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
  }, [queueItems, t, start]);

  const handleRandom = useCallback(async (queueId: number) => {
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
  }, [products, t, saveItems]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('manager.title')} />

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
                      {idx + 1}. {p ? getProductName(p, isAr) : '...'}
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
  ...sharedStyles,
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  queueCard: {
    backgroundColor: colors.bgLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  queueName: { fontSize: 20, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: colors.success },
  badgeInactive: { backgroundColor: colors.bgGray },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.white },
  itemCount: { fontSize: 14, color: colors.textMid, marginBottom: 6 },
  previewList: { gap: 2, marginBottom: 8 },
  previewItem: { fontSize: 13, color: '#555' },
  previewMore: { fontSize: 13, color: colors.textMuted },
  buttonRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  startBtn: { backgroundColor: colors.success },
  editBtn: { backgroundColor: colors.primary },
  randomBtn: { backgroundColor: colors.warning },
  btnDisabled: { opacity: 0.4 },
  actionBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});