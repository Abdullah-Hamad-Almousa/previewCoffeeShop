import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { enrollMFA, verifyMFA, unenrollMFA, listMFAFactors } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';

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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {t('nav.settings')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('auth.mfa.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.mfa.subtitle')}</Text>
      <Text style={styles.optional}>{t('auth.mfa.optional')}</Text>

      {/* IDLE — not enrolled, no QR yet */}
      {state === 'idle' && (
        <Pressable style={styles.buttonPrimary} onPress={handleEnable}>
          <Text style={styles.buttonText}>{t('auth.mfa.enable')}</Text>
        </Pressable>
      )}

      {/* ENROLLING — loading */}
      {state === 'enrolling' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )}

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
            style={[styles.buttonPrimary, (state === 'verifying' || code.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={state === 'verifying' || code.length !== 6}
          >
            <Text style={styles.buttonText}>
              {state === 'verifying' ? t('auth.mfa.verifying') : t('auth.mfa.verify')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ENABLED — show status + disable */}
      {(state === 'enabled' || state === 'disabling') && (
        <View style={styles.section}>
          <Text style={[styles.statusText, { color: '#34C759' }]}>
            {t('auth.mfa.enabled')}
          </Text>
          <Pressable
            style={[styles.buttonDanger, state === 'disabling' && styles.buttonDisabled]}
            onPress={handleDisable}
            disabled={state === 'disabling'}
          >
            <Text style={styles.buttonText}>{t('auth.mfa.disable')}</Text>
          </Pressable>
        </View>
      )}

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  optional: { fontSize: 13, color: '#999', marginBottom: 24 },
  section: { marginTop: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 8 },
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  link: { color: '#007AFF', fontSize: 16, marginTop: 8 },
});