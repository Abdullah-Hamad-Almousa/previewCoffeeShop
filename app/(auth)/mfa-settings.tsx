import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { enrollMFA, verifyMFA, unenrollMFA, listMFAFactors } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/Footer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { sharedStyles, colors } from '@/lib/theme';

type MFAState = 'idle' | 'enrolling' | 'enrolled' | 'verifying' | 'enabled' | 'disabling';

export default function MfaSettingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<MFAState>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [existingFactorId, setExistingFactorId] = useState('');

  // Check if MFA is already enabled on mount
  useEffect(() => {
    checkExistingFactors();
  }, []);

  const checkExistingFactors = async () => {
    try {
      const data = await listMFAFactors();
      const verified = data.all.find((f: any) => f.status === 'verified');
      if (verified) {
        setExistingFactorId(verified.id);
        setState('enabled');
      }
    } catch {
      // ignore — user may not have MFA
    }
  };

  const handleEnable = async () => {
    setState('enrolling');
    try {
      const data = await enrollMFA();
      setQrUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setState('enrolled');
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? '');
      setState('idle');
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) return;
    setState('verifying');
    try {
      await verifyMFA(factorId, code);
      setState('enabled');
      setExistingFactorId(factorId);
      setCode('');
      Alert.alert(t('auth.mfa.verifySuccess'));
    } catch (err: any) {
      Alert.alert(t('auth.mfa.verifyFailed'), err?.message ?? '');
      setState('enrolled');
    }
  };

  const handleDisable = async () => {
    setState('disabling');
    try {
      await unenrollMFA(existingFactorId || factorId);
      setState('idle');
      setQrUrl('');
      setSecret('');
      setFactorId('');
      setExistingFactorId('');
      setCode('');
      Alert.alert(t('auth.mfa.disableSuccess'));
    } catch (err: any) {
      Alert.alert(t('auth.mfa.disableFailed'), err?.message ?? '');
      setState('enabled');
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>{t('auth.signIn')}</Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={styles.link}>{t('auth.signIn')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('nav.settings')} />

      <Text style={styles.title}>{t('auth.mfa.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.mfa.subtitle')}</Text>
      <Text style={styles.optional}>{t('auth.mfa.optional')}</Text>

      {/* IDLE — not enrolled, no QR yet */}
      {state === 'idle' && (
        <Pressable style={styles.primaryBtn} onPress={handleEnable}>
          <Text style={styles.primaryBtnText}>{t('auth.mfa.enable')}</Text>
        </Pressable>
      )}

      {/* ENROLLING — loading */}
      {state === 'enrolling' && <LoadingSpinner />}

      {/* ENROLLED — show QR + verify */}
      {(state === 'enrolled' || state === 'verifying') && (
        <View style={styles.section}>
          <Text style={styles.label}>{t('auth.mfa.scanQR')}</Text>
          {qrUrl ? (
            <Image source={{ uri: qrUrl }} style={styles.qr} contentFit="contain" />
          ) : null}
          <Text style={styles.label}>{t('auth.mfa.orEnterCode')}</Text>
          <Text style={styles.secret}>{secret}</Text>

          <Text style={styles.label}>{t('auth.mfa.enterCode')}</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
          />
          <Pressable
            style={[styles.primaryBtn, (state === 'verifying' || code.length !== 6) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={state === 'verifying' || code.length !== 6}
          >
            <Text style={styles.primaryBtnText}>
              {state === 'verifying' ? t('auth.mfa.verifying') : t('auth.mfa.verify')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ENABLED — show status + disable */}
      {(state === 'enabled' || state === 'disabling') && (
        <View style={styles.section}>
          <Text style={[styles.statusText, { color: colors.success }]}>
            {t('auth.mfa.enabled')}
          </Text>
          <Pressable
            style={[styles.buttonDanger, state === 'disabling' && styles.btnDisabled]}
            onPress={handleDisable}
            disabled={state === 'disabling'}
          >
            <Text style={styles.primaryBtnText}>{t('auth.mfa.disable')}</Text>
          </Pressable>
        </View>
      )}

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMid, marginBottom: 4 },
  optional: { fontSize: 13, color: colors.textMuted, marginBottom: 24 },
  section: { marginTop: 16, gap: 12 },
  qr: { width: 200, height: 200, alignSelf: 'center', marginVertical: 12 },
  secret: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    letterSpacing: 2,
  },
  codeInput: {
    ...sharedStyles.input,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  statusText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  link: { color: colors.primary, fontSize: 16, marginTop: 8 },
});