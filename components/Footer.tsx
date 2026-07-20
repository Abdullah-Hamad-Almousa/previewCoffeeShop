import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/lib/theme';

export function Footer() {
  const { t } = useTranslation();
  return (
    <View style={{ paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12 }}>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>
        ⚙️ {t('app.name')} · {t('app.version')} ⚙️
      </Text>
    </View>
  );
}