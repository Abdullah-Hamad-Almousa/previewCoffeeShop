import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const setLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirm !== user.username) {
      Alert.alert(t('settings.deleteAccountError'));
      return;
    }
    setDeleting(true);
    try {
      // Delete profile row
      await supabase.from('profiles').delete().eq('user_id', user.id);
      // Sign out
      await supabase.auth.signOut();
      setShowDeleteModal(false);
      setDeleteConfirm('');
      Alert.alert(t('settings.deleteAccountSuccess'));
      router.replace('/(auth)/sign-in');
    } catch (err: any) {
      Alert.alert(t('settings.deleteAccountError'), err?.message ?? '');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('nav.home')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('nav.settings')}</Text>

      {/* Language section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('common.language')}</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, i18n.language === 'en' && styles.langBtnTextActive]}>
              {t('common.english')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, i18n.language === 'ar' && styles.langBtnActive]}
            onPress={() => setLanguage('ar')}
          >
            <Text style={[styles.langBtnText, i18n.language === 'ar' && styles.langBtnTextActive]}>
              {t('common.arabic')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Account section */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{user.username}</Text>
          <Pressable onPress={() => router.push('/(auth)/mfa-settings')} style={styles.rowButton}>
            <Text style={styles.rowText}>{t('auth.mfa.title')}</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <Pressable onPress={() => signOut()} style={styles.rowButton}>
            <Text style={[styles.rowText, { color: '#FF3B30' }]}>{t('auth.signOut')}</Text>
          </Pressable>
          <Pressable onPress={() => setShowDeleteModal(true)} style={styles.rowButton}>
            <Text style={[styles.rowText, { color: '#FF3B30' }]}>{t('settings.deleteAccount')}</Text>
          </Pressable>
        </View>
      )}

      {/* Version label */}
      <View style={styles.versionSection}>
        <Text style={styles.versionText}>
          {t('app.name')} · {t('app.version')}
        </Text>
      </View>

      {/* Delete account modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('settings.deleteAccount')}</Text>
            <Text style={styles.modalHint}>
              {t('settings.deleteAccountHint')}{'\n'}
              <Text style={styles.modalUsername}>{user?.username}</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={user?.username}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDeleteBtn, (deleting || deleteConfirm !== user?.username) && styles.modalDeleteBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== user?.username}
              >
                <Text style={styles.modalDeleteText}>
                  {deleting ? t('common.loading') : t('settings.deleteAccount')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#007AFF', backgroundColor: '#F0F6FF' },
  langBtnText: { fontSize: 16, fontWeight: '500', color: '#666' },
  langBtnTextActive: { color: '#007AFF', fontWeight: '600' },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  rowText: { fontSize: 17 },
  arrow: { fontSize: 22, color: '#ccc' },
  versionSection: { alignItems: 'center', marginTop: 40 },
  versionText: { fontSize: 13, color: '#999' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#FF3B30' },
  modalHint: { fontSize: 15, color: '#666', marginBottom: 16, lineHeight: 22 },
  modalUsername: { fontWeight: 'bold', color: '#333' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, color: '#666', fontWeight: '500' },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDeleteBtnDisabled: { opacity: 0.4 },
  modalDeleteText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});