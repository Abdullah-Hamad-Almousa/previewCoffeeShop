import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useProducts } from '@/hooks/useProducts';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useIsAr, getProductName } from '@/lib/helpers';
import { sharedStyles, colors } from '@/lib/theme';

export default function ManagerProductsScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { products, loading } = useProducts();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('manager.title')} />

      <Text style={styles.title}>{t('manager.productsManagement')}</Text>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => item.id}
          estimatedItemSize={76}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(manager)/edit-product/${item.id}`)}
            >
              <View style={styles.imageWrap}>
                <ProductImage
                  product={item}
                  style={styles.image}
                  placeholderFontSize={18}
                  placeholderBg={colors.bgLight}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{getProductName(item, isAr)}</Text>
                <Text style={styles.price}>
                  {item.price.toFixed(2)} {t('products.currency')}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  imageWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, color: colors.primary },
  arrow: { fontSize: 22, color: '#ccc' },
  separator: { height: 1, backgroundColor: '#eee' },
});