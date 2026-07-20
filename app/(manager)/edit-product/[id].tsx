import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { updateProduct } from '@/services/products';
import { useProduct } from '@/hooks/useProducts';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Footer } from '@/components/Footer';
import { sharedStyles, colors } from '@/lib/theme';

export default function EditProductScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading } = useProduct(id);

  const [saving, setSaving] = useState(false);

  // Editable fields
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (product) {
      setNameEn(product.name_en);
      setNameAr(product.name_ar);
      setDescEn(product.description_en ?? '');
      setDescAr(product.description_ar ?? '');
      setPrice(String(product.price));
      setImageUrl(product.image_url ?? '');
    }
  }, [product]);

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
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={sharedStyles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title={t('manager.productsManagement')} />

      <Text style={styles.title}>{t('manager.editProduct')}</Text>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.nameEn')}</Text>
        <TextInput style={sharedStyles.input} value={nameEn} onChangeText={setNameEn} />
      </View>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.nameAr')}</Text>
        <TextInput style={sharedStyles.input} value={nameAr} onChangeText={setNameAr} />
      </View>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.descEn')}</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea]}
          value={descEn}
          onChangeText={setDescEn}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.descAr')}</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea]}
          value={descAr}
          onChangeText={setDescAr}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.priceLabel')}</Text>
        <TextInput
          style={sharedStyles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={sharedStyles.field}>
        <Text style={sharedStyles.label}>{t('manager.imageUrl')}</Text>
        <TextInput
          style={sharedStyles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable
        style={[sharedStyles.primaryBtn, styles.saveButton, saving && sharedStyles.btnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={sharedStyles.primaryBtnText}>
          {saving ? t('manager.saving') : t('manager.saveChanges')}
        </Text>
      </Pressable>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  saveButton: { marginBottom: 24 },
  notFound: { fontSize: 18, color: colors.textMid },
});