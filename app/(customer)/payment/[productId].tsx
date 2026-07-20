import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { createPayment, type PaymentMethod, type PaymentResult, type CardDetails } from '@/services/payment';
import { useCanPay } from '@/hooks/useCanPay';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles } from '@/lib/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';

type ScreenState = 'form' | 'processing' | 'success' | 'failed';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { user } = useAuth();
  const { canPay, loading: flagsLoading } = useCanPay();
  const { product, loading } = useProduct(productId);

  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Card form
  const [method, setMethod] = useState<PaymentMethod>('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handlePay = async () => {
    if (!product || !user) return;

    setScreenState('processing');

    const card: CardDetails = {
      number: cardNumber,
      name: cardName,
      expiry: cardExpiry,
      cvc: cardCvc,
    };

    try {
      const result = await createPayment(product.id, product.price, method, card);
      setPaymentResult(result);

      if (result.success) {
        setScreenState('success');
      } else {
        setScreenState('failed');
      }
    } catch (err: any) {
      setPaymentResult({
        success: false,
        status: 'failed',
        message: err?.message ?? t('payment.failedMessage'),
      });
      setScreenState('failed');
    }
  };

  if (loading || flagsLoading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t('payment.backToProduct')}</Text>
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
          <Text style={styles.resultTitle}>{t('payment.success')}</Text>
          <Text style={styles.resultMessage}>{t('payment.successMessage')}</Text>
          {paymentResult?.orderId && (
            <Text style={styles.orderId}>
              {t('payment.orderId')}: {paymentResult.orderId.substring(0, 8)}
            </Text>
          )}
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(customer)')}>
            <Text style={styles.primaryButtonText}>{t('payment.done')}</Text>
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
          <Text style={styles.resultTitle}>{t('payment.failed')}</Text>
          <Text style={styles.resultMessage}>
            {paymentResult?.message ?? t('payment.failedMessage')}
          </Text>
          <View style={styles.resultButtonRow}>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>{t('payment.backToProduct')}</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => setScreenState('form')}>
              <Text style={styles.primaryButtonText}>{t('payment.retry')}</Text>
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
        <Text style={styles.processingText}>{t('payment.paying')}</Text>
      </View>
    );
  }

  // Payment form (always visible)
  return (
    <ScrollView contentContainerStyle={sharedStyles.container}>
      <ScreenHeader title={getProductName(product, isAr)} />

      <Text style={styles.title}>{t('payment.title')}</Text>

      {/* Preview warning — always visible, both languages */}
      <View style={styles.warningCard}>
        <Text style={styles.warningText}>{t('payment.previewWarning')}</Text>
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

      {/* Payment method selector */}
      <Text style={sharedStyles.label}>{t('payment.paymentMethod')}</Text>
      <View style={styles.methodRow}>
        {(['mada', 'visa', 'applepay'] as PaymentMethod[]).map((m) => (
          <Pressable
            key={m}
            style={[styles.methodBtn, method === m && styles.methodBtnActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>
              {t(`payment.${m === 'applepay' ? 'applePay' : m}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Card fields — always visible, even when canPay is false */}
      {method !== 'applepay' && (
        <>
          <View style={sharedStyles.field}>
            <Text style={sharedStyles.label}>{t('payment.cardNumber')}</Text>
            <TextInput
              style={sharedStyles.input}
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="4111 1111 1111 1111"
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={sharedStyles.field}>
            <Text style={sharedStyles.label}>{t('payment.cardName')}</Text>
            <TextInput
              style={sharedStyles.input}
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[sharedStyles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={sharedStyles.label}>{t('payment.cardExpiry')}</Text>
              <TextInput
                style={sharedStyles.input}
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="MM/YY"
                maxLength={5}
              />
            </View>
            <View style={[sharedStyles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={sharedStyles.label}>{t('payment.cardCvc')}</Text>
              <TextInput
                style={sharedStyles.input}
                value={cardCvc}
                onChangeText={setCardCvc}
                placeholder="123"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </>
      )}

      {/* Pay button — DISABLED when canPay is false */}
      <Pressable
        style={[styles.payButton, !canPay && styles.payButtonDisabled]}
        onPress={handlePay}
        disabled={!canPay || !user}
      >
        <Text style={styles.payButtonText}>
          {canPay ? t('payment.payButton') : t('payment.paymentBlocked')}
        </Text>
      </Pressable>

      {/* Disabled message */}
      {!canPay && (
        <Text style={styles.disabledMessage}>{t('payment.paymentDisabled')}</Text>
      )}

      {/* Not logged in message */}
      {!user && (
        <Text style={styles.disabledMessage}>{t('auth.signIn')}</Text>
      )}

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
  // Methods
  rowFields: { flexDirection: 'row' },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  methodBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  methodBtnActive: { borderColor: '#007AFF', backgroundColor: '#F0F6FF' },
  methodBtnText: { fontSize: 14, fontWeight: '500', color: '#666' },
  methodBtnTextActive: { color: '#007AFF', fontWeight: '600' },
  // Pay button
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  payButtonDisabled: { backgroundColor: '#E5E5EA' },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabledMessage: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 16 },
  // Results
  resultCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  resultIcon: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  resultMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  orderId: { fontSize: 14, color: '#999', marginBottom: 24 },
  resultButtonRow: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    backgroundColor: '#007AFF',
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