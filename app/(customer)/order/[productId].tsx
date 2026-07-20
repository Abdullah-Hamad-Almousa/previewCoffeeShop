import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { createFreeOrder, calcPickupTime, type PickupSlot } from '@/services/orders';
import { getRandomRiyadhArea, type RiyadhArea } from '@/lib/riyadh-locations';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles } from '@/lib/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';

type ScreenState = 'form' | 'processing' | 'success' | 'failed';

export default function OrderScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuth();
  const { product, loading } = useProduct(productId);

  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pickupSlot, setPickupSlot] = useState<PickupSlot>('asap');
  const [deliveryArea, setDeliveryArea] = useState<RiyadhArea>(() => getRandomRiyadhArea());

  const handleShuffle = useCallback(() => {
    setDeliveryArea(getRandomRiyadhArea());
  }, []);

  const handleConfirm = async () => {
    if (!product || !user || !deliveryArea) return;
    setScreenState('processing');

    const pickupTime = calcPickupTime(pickupSlot);

    try {
      const result = await createFreeOrder(product.id, pickupTime, deliveryArea, isAr);
      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        setScreenState('success');
      } else {
        setScreenState('failed');
      }
    } catch {
      setScreenState('failed');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t('order.backToProduct')}</Text>
        </Pressable>
      </View>
    );
  }

  // Success screen
  if (screenState === 'success') {
    return (
      <ScrollView contentContainerStyle={sharedStyles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>✅</Text>
          <Text style={styles.resultTitle}>{t('order.success')}</Text>
          <Text style={styles.resultMessage}>{t('order.successMessage')}</Text>
          {orderId && (
            <Text style={styles.orderIdText}>
              {t('order.orderId')}: {orderId.substring(0, 8)}
            </Text>
          )}
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(customer)')}>
            <Text style={styles.primaryButtonText}>{t('order.done')}</Text>
          </Pressable>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  // Failed screen
  if (screenState === 'failed') {
    return (
      <ScrollView contentContainerStyle={sharedStyles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>❌</Text>
          <Text style={styles.resultTitle}>{t('order.failed')}</Text>
          <Text style={styles.resultMessage}>{t('order.failedMessage')}</Text>
          <View style={styles.resultButtonRow}>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>{t('order.backToProduct')}</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setScreenState('form')}>
              <Text style={styles.primaryButtonText}>{t('order.confirmOrder')}</Text>
            </Pressable>
          </View>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  // Processing screen
  if (screenState === 'processing') {
    return (
      <View style={styles.center}>
        <LoadingSpinner fullScreen={false} />
        <Text style={styles.processingText}>{t('order.ordering')}</Text>
      </View>
    );
  }

  // Order form
  return (
    <ScrollView contentContainerStyle={sharedStyles.container}>
      <ScreenHeader title={getProductName(product, isAr)} />

      <Text style={styles.title}>{t('order.title')}</Text>

      {/* Preview note */}
      <View style={styles.warningCard}>
        <Text style={styles.warningText}>{t('order.previewNote')}</Text>
      </View>

      {/* Product summary */}
      <View style={styles.productRow}>
        <View style={styles.productImageWrap}>
          <ProductImage
            product={product}
            style={styles.productImage}
            placeholderFontSize={18}
            placeholderBg="#F5F5F7"
          />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{getProductName(product, isAr)}</Text>
          <Text style={styles.productPrice}>
            {t('payment.amount')}: {product.price.toFixed(2)} {t('products.currency')}
          </Text>
        </View>
      </View>

      {/* Pickup time selector */}
      <Text style={sharedStyles.label}>{t('order.pickupTime')}</Text>
      <View style={styles.slotRow}>
        {([
          { key: 'asap', label: t('order.asap') },
          { key: '30min', label: t('order.in30min') },
          { key: '1hour', label: t('order.in1hour') },
        ] as { key: PickupSlot; label: string }[]).map((slot) => (
          <Pressable
            key={slot.key}
            style={[styles.slotBtn, pickupSlot === slot.key && styles.slotBtnActive]}
            onPress={() => setPickupSlot(slot.key)}
          >
            <Text style={[styles.slotBtnText, pickupSlot === slot.key && styles.slotBtnTextActive]}>
              {slot.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.customBtn, pickupSlot === 'custom' && styles.customBtnActive]}
        onPress={() => setPickupSlot('custom')}
      >
        <Text style={[styles.customBtnText, pickupSlot === 'custom' && styles.customBtnTextActive]}>
          {t('order.custom')}
        </Text>
      </Pressable>

      {/* Delivery location */}
      <Text style={sharedStyles.label}>{t('order.deliveryLocation')}</Text>
      <View style={styles.locationCard}>
        <Text style={styles.locationName}>
          📍 {isAr ? deliveryArea.name_ar : deliveryArea.name_en}
        </Text>
        <Text style={styles.locationCoords}>
          {deliveryArea.lat.toFixed(4)}, {deliveryArea.lng.toFixed(4)}
        </Text>
        <Pressable style={styles.shuffleBtn} onPress={handleShuffle}>
          <Text style={styles.shuffleBtnText}>🎲 {t('order.shuffleLocation')}</Text>
        </Pressable>
      </View>

      {/* Confirm button — disabled if not logged in */}
      <Pressable
        style={[styles.confirmButton, !user && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!user}
      >
        <Text style={styles.confirmButtonText}>
          {user ? t('order.confirmOrder') : t('order.loginRequired')}
        </Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  // Warning
  warningCard: {
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  warningText: { fontSize: 13, color: '#996600', lineHeight: 20, textAlign: 'center' },
  // Product summary
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  productImageWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600' },
  productPrice: { fontSize: 14, color: '#007AFF', marginTop: 4 },
  // Pickup time slots
  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  slotBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  slotBtnActive: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  slotBtnText: { fontSize: 13, fontWeight: '500', color: '#666' },
  slotBtnTextActive: { color: '#34C759', fontWeight: '600' },
  customBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  customBtnActive: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  customBtnText: { fontSize: 14, fontWeight: '500', color: '#666' },
  customBtnTextActive: { color: '#34C759', fontWeight: '600' },
  // Location card
  locationCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 6,
  },
  locationName: { fontSize: 18, fontWeight: '600', color: '#333' },
  locationCoords: { fontSize: 13, color: '#999' },
  shuffleBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  shuffleBtnText: { fontSize: 14, fontWeight: '500', color: '#666' },
  // Confirm button
  confirmButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  confirmButtonDisabled: { backgroundColor: '#E5E5EA' },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  // Results
  resultCard: { alignItems: 'center', padding: 32, marginTop: 40 },
  resultIcon: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  resultMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  orderIdText: { fontSize: 14, color: '#999', marginBottom: 24 },
  resultButtonRow: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
  processingText: { fontSize: 16, color: '#666', marginTop: 16 },
  notFound: { fontSize: 18, color: '#666' },
  link: { fontSize: 16, color: '#007AFF', marginTop: 8 },
});