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

import { getPaymentSettings, updatePaymentEnabled } from '@/services/products';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Footer } from '@/components/Footer';

export default function PaymentScreen() {
  const { t } = useTranslation();

  const [paymentSuper, setPaymentSuper] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getPaymentSettings()
      .then((settings) => {
        setPaymentSuper(settings.payment_super);
        setPaymentEnabled(settings.payment_enabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    const newValue = !paymentEnabled;
    setToggling(true);
    try {
      await updatePaymentEnabled(newValue);
      setPaymentEnabled(newValue);
    } catch (err: any) {
      Alert.alert(t('manager.toggleUpdateFailed'), err?.message ?? '');
    } finally {
      setToggling(false);
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

      <Text style={styles.title}>{t('manager.paymentToggle')}</Text>

      {/* payment_super — READ ONLY */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('manager.paymentSuper')}</Text>
        <View style={styles.readOnlyRow}>
          <View style={[styles.badge, paymentSuper ? styles.badgeOn : styles.badgeOff]}>
            <Text style={styles.badgeText}>
              {paymentSuper ? t('manager.paymentSuperOn') : t('manager.paymentSuperOff')}
            </Text>
          </View>
        </View>
        <Text style={styles.note}>{t('manager.paymentSuperNote')}</Text>
      </View>

      {/* payment_enabled — manager can toggle */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('manager.paymentEnabled')}</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, paymentEnabled ? styles.toggleOn : styles.toggleOff]}
            onPress={handleToggle}
            disabled={toggling}
          >
            <Text style={styles.toggleText}>
              {toggling ? '...' : paymentEnabled ? t('manager.toggleOn') : t('manager.toggleOff')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Logic explanation */}
      <View style={styles.logicCard}>
        <Text style={styles.logicText}>
          canPay = payment_super AND payment_enabled
        </Text>
        <Text style={styles.logicStatus}>
          {paymentSuper && paymentEnabled ? '✅ Payment is ON' : '🚫 Payment is OFF'}
        </Text>
      </View>

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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  badgeOn: { backgroundColor: '#34C759' },
  badgeOff: { backgroundColor: '#E5E5EA' },
  badgeText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  note: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  toggleRow: { flexDirection: 'row' },
  toggle: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleOn: { backgroundColor: '#34C759' },
  toggleOff: { backgroundColor: '#E5E5EA' },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  logicCard: {
    backgroundColor: '#FFFBE6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logicText: { fontSize: 15, fontWeight: '600', color: '#666', marginBottom: 6 },
  logicStatus: { fontSize: 16, fontWeight: '600' },
});