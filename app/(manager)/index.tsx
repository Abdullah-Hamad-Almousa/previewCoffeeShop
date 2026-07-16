import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function ManagerPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('manager.title')}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <View style={styles.section}>
        <Link href="/(manager)/products" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navText}>{t('manager.productsManagement')}</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(manager)/recommendation" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navText}>{t('manager.recommendationToday')}</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(manager)/payment" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navText}>{t('manager.paymentToggle')}</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(manager)/queue-section" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navText}>{t('manager.queueSection')}</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/(customer)" style={styles.backLink}>
        <Text style={styles.backLinkText}>‹ {t('nav.home')}</Text>
      </Link>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  section: { flex: 1, gap: 10 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  navButtonDisabled: { opacity: 0.5 },
  navText: { fontSize: 17, fontWeight: '500' },
  navArrow: { fontSize: 22, color: '#ccc' },
  backLink: { marginTop: 20, marginBottom: 8 },
  backLinkText: { fontSize: 16, color: '#007AFF' },
});