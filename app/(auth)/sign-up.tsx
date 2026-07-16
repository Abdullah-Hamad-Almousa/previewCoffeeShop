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

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = t('auth.validation.usernameRequired');
    else if (username.length < 6) e.username = t('auth.validation.usernameTooShort');
    else if (username.length > 24) e.username = t('auth.validation.usernameTooLong');
    else if (!/^[a-zA-Z0-9]+$/.test(username)) e.username = t('auth.validation.usernameInvalid');
    if (!email.trim()) e.email = t('auth.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('auth.validation.emailInvalid');
    if (!password) e.password = t('auth.validation.passwordRequired');
    else if (password.length < 6) e.password = t('auth.validation.passwordTooShort');
    if (!confirm) e.confirm = t('auth.validation.confirmRequired');
    else if (password !== confirm) e.confirm = t('auth.validation.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    if (!captchaToken) {
      Alert.alert(t('auth.errors.captchaFailed'));
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, captchaToken, username);
      router.replace('/(customer)');
    } catch (err: any) {
      const msg = err?.message ?? t('auth.errors.signUpFailed');
      Alert.alert(t('auth.errors.signUpFailed'), msg);
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

        <Text style={styles.title}>{t('auth.signUp')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.username')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
          {errors.username ? <Text style={styles.error}>{errors.username}</Text> : null}
        </View>

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

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.confirm ? <Text style={styles.error}>{errors.confirm}</Text> : null}
        </View>

        <View style={styles.field}>
          <Turnstile onToken={setCaptchaToken} />
        </View>

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSignUp} disabled={submitting}>
          <Text style={styles.buttonText}>
            {submitting ? t('auth.signingUp') : t('auth.signUpButton')}
          </Text>
        </Pressable>

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
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