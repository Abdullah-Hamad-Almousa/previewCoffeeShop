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
    else if (password.length < 8) e.password = t('auth.validation.passwordTooShort');
    else if (password.length > 32) e.password = t('auth.validation.passwordTooLong');
    else if (!/[A-Z]/.test(password)) e.password = t('auth.validation.passwordNoUpper');
    else if (!/[a-z]/.test(password)) e.password = t('auth.validation.passwordNoLower');
    else if (!/[0-9]/.test(password)) e.password = t('auth.validation.passwordNoNumber');
    else if (!/[^a-zA-Z0-9\s]/.test(password)) e.password = t('auth.validation.passwordNoSpecial');
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
        <ScreenHeader title={t('nav.home')} />

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

        <Pressable style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleSignUp} disabled={submitting}>
          <Text style={styles.primaryBtnText}>
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
  ...sharedStyles,
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  error: { fontSize: 12, color: colors.danger, marginTop: 4 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.primary },
});