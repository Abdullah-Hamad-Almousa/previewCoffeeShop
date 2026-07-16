import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getProduct, updateProduct, type Product } from '@/services/products';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Footer } from '@/components/Footer';

export default function EditProductScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((data) => {
        if (data) {
          setProduct(data);
          setNameEn(data.name_en);
          setNameAr(data.name_ar);
          setDescEn(data.description_en ?? '');
          setDescAr(data.description_ar ?? '');
          setPrice(String(data.price));
          setImageUrl(data.image_url ?? '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name_en: nameEn,
        name_ar: nameAr,
        description_en: descEn || null,
        description_ar: descAr || null,
        price: parseFloat(price) || 0,
        image_url: imageUrl || null,
      });
      Alert.alert(t('manager.savedSuccess'));
      router.back();
    } catch (err: any) {
      Alert.alert(t('manager.saveFailed'), err?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ {t('manager.productsManagement')}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <Text style={styles.title}>{t('manager.editProduct')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.nameEn')}</Text>
        <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.nameAr')}</Text>
        <TextInput style={styles.input} value={nameAr} onChangeText={setNameAr} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.descEn')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descEn}
          onChangeText={setDescEn}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.descAr')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descAr}
          onChangeText={setDescAr}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.priceLabel')}</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('manager.imageUrl')}</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t('manager.saving') : t('manager.saveChanges')}
        </Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
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
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  notFound: { fontSize: 18, color: '#666' },
});