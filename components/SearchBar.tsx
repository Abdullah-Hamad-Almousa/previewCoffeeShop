import { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { Product } from '@/services/products';
import { createSearchIndex, searchProducts } from '@/lib/search';

interface SearchBarProps {
  products: Product[];
  onSelectProduct: (id: string) => void;
}

export function SearchBar({ products, onSelectProduct }: SearchBarProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Build the Fuse index once when products change
  const fuse = useMemo(() => createSearchIndex(products), [products]);

  // Search live as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setResults(searchProducts(fuse, query, products));
  }, [query, fuse, products]);

  const showResults = focused && query.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputRow, isAr && styles.inputRowRTL]}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, isAr && styles.inputRTL]}
          placeholder={t('search.placeholder')}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign={isAr ? 'right' : 'left'}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Live results dropdown */}
      {showResults && (
        <View style={styles.dropdown}>
          {results.length === 0 ? (
            <Text style={styles.noResults}>{t('search.noResults')}</Text>
          ) : (
            results.map((product) => (
              <Pressable
                key={product.id}
                style={styles.resultRow}
                onPress={() => {
                  onSelectProduct(product.id);
                  setQuery('');
                  setFocused(false);
                }}
              >
                <View style={styles.resultImageWrap}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.resultImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.resultImage, styles.placeholder]}>
                      <Text style={styles.placeholderText}>
                        {product.initials}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {isAr ? product.name_ar : product.name_en}
                  </Text>
                  <Text style={styles.resultPrice}>
                    {product.price.toFixed(2)} {t('products.currency')}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputRowRTL: { flexDirection: 'row-reverse' },
  icon: { fontSize: 16, marginHorizontal: 6 },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  inputRTL: { textAlign: 'right' },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 14, color: '#999' },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noResults: {
    padding: 16,
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultImageWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  resultImage: { width: '100%', height: '100%' },
  placeholder: {
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 14, fontWeight: 'bold', color: '#999' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '500' },
  resultPrice: { fontSize: 13, color: '#007AFF', marginTop: 2 },
});