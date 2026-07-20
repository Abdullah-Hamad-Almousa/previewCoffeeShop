import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { Turnstile } from '@/components/Turnstile';
import { ScreenHeader } from '@/components/ScreenHeader';
import { sharedStyles, colors } from '@/lib/theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t('auth.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('auth.validation.emailInvalid');
    if (!password) e.password = t('auth.validation.passwordRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    if (!captchaToken) {
      Alert.alert(t('auth.errors.captchaFailed'));
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password, captchaToken);
      router.replace('/(customer)');
    } catch (err: any) {
      const msg = err?.message ?? t('auth.errors.signInFailed');
      Alert.alert(t('auth.errors.signInFailed'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('nav.home')} />

        <Text style={styles.title}>{t('auth.signIn')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
        </View>

        {/* Remember me */}
        <Pressable style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
        </Pressable>

        <View style={styles.field}>
          <Turnstile onToken={setCaptchaToken} />
        </View>

        <Pressable style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleSignIn} disabled={submitting}>
          <Text style={styles.primaryBtnText}>
            {submitting ? t('auth.signingIn') : t('auth.signInButton')}
          </Text>
        </Pressable>

        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={styles.linkText}>{t('auth.noAccount')}</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  error: { fontSize: 12, color: colors.danger, marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  rememberText: { fontSize: 15, color: colors.textDark },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.primary },
});