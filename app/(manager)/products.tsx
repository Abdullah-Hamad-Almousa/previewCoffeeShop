import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { getProducts, type Product } from '@/services/products';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function ManagerProductsScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('manager.title')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('manager.productsManagement')}</Text>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/(manager)/edit-product/${item.id}`)}
            >
              <View style={styles.imageWrap}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
                ) : (
                  <View style={[styles.image, styles.placeholder]}>
                    <Text style={styles.placeholderText}>{item.initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{isAr ? item.name_ar : item.name_en}</Text>
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
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  loader: { marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  imageWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#999' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, color: '#007AFF' },
  arrow: { fontSize: 22, color: '#ccc' },
  separator: { height: 1, backgroundColor: '#eee' },
});