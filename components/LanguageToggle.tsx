import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language;
  const toggle = () => {
    i18n.changeLanguage(current === 'en' ? 'ar' : 'en');
  };

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <Text style={styles.icon}>🌐</Text>
      <Text style={styles.text}>
        {current === 'en' ? t('common.arabic') : t('common.english')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: { fontSize: 14 },
  text: { fontSize: 14, color: '#007AFF' },
});