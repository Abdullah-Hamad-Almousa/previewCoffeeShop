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
import { LanguageToggle } from '@/components/LanguageToggle';

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
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(customer)')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ {t('nav.home')}</Text>
          </Pressable>
          <LanguageToggle />
        </View>

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

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSignIn} disabled={submitting}>
          <Text style={styles.buttonText}>
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
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { fontSize: 12, color: '#FF3B30', marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  rememberText: { fontSize: 15, color: '#333' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#007AFF' },
});