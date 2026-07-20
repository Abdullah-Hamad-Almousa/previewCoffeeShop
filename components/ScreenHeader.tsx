import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '@/components/LanguageToggle';
import { sharedStyles, colors } from '@/lib/theme';

interface ScreenHeaderProps {
  title?: string;
}

/** Reusable header: back button (‹ title) + LanguageToggle.
 *  If title is omitted, only shows LanguageToggle (for home screens). */
export function ScreenHeader({ title }: ScreenHeaderProps) {
  if (!title) {
    return (
      <View style={styles.headerRight}>
        <LanguageToggle />
      </View>
    );
  }

  return (
    <View style={sharedStyles.header}>
      <Pressable onPress={() => router.back()} style={sharedStyles.backBtn}>
        <Text style={styles.backText}>‹ {title}</Text>
      </Pressable>
      <LanguageToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  backText: { fontSize: 16, color: colors.brass },
});