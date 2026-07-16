import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: '#999' }}>
        {t('app.name')} · {t('app.version')}
      </Text>
    </View>
  );
}