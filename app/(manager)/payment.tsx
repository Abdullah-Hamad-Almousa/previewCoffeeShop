import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { getPaymentSettings, updatePaymentEnabled } from '@/services/products';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';
import { sharedStyles, colors } from '@/lib/theme';

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
    return <LoadingSpinner />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('manager.title')} />

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
  ...sharedStyles,
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: colors.bgLight,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  badgeOn: { backgroundColor: colors.success },
  badgeOff: { backgroundColor: colors.bgGray },
  badgeText: { fontSize: 15, fontWeight: '600', color: colors.white },
  note: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  toggleRow: { flexDirection: 'row' },
  toggle: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleOn: { backgroundColor: colors.success },
  toggleOff: { backgroundColor: colors.bgGray },
  toggleText: { fontSize: 16, fontWeight: '600', color: colors.white },
  logicCard: {
    backgroundColor: '#FFFBE6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logicText: { fontSize: 15, fontWeight: '600', color: colors.textMid, marginBottom: 6 },
  logicStatus: { fontSize: 16, fontWeight: '600' },
});