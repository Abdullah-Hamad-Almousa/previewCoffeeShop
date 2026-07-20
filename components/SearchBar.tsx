import { memo, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Product } from '@/services/products';
import { createSearchIndex, searchProducts } from '@/lib/search';
import { ProductImage } from '@/components/ProductImage';
import { useIsAr, getProductName } from '@/lib/helpers';
import { colors } from '@/lib/theme';

// Memoized search result row
const SearchResultRow = memo(function SearchResultRow({
  product,
  isAr,
  currency,
  onPress,
}: {
  product: Product;
  isAr: boolean;
  currency: string;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      style={styles.resultRow}
      onPress={() => onPress(product.id)}
    >
      <View style={styles.resultImageWrap}>
        <ProductImage
          product={product}
          style={styles.resultImage}
          placeholderFontSize={14}
          placeholderBg={colors.bgLight}
        />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {getProductName(product, isAr)}
        </Text>
        <Text style={styles.resultPrice}>
          {product.price.toFixed(2)} {currency}
        </Text>
      </View>
    </Pressable>
  );
});

interface SearchBarProps {
  products: Product[];
  onSelectProduct: (id: string) => void;
}

export function SearchBar({ products, onSelectProduct }: SearchBarProps) {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Build the Fuse index once when products change
  const fuse = useMemo(() => createSearchIndex(products), [products]);

  // Memoized search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(fuse, query, products);
  }, [query, fuse, products]);

  const showResults = focused && query.trim().length > 0;

  // Stable callbacks
  const handleSelect = useCallback((id: string) => {
    onSelectProduct(id);
    setQuery('');
    setFocused(false);
  }, [onSelectProduct]);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setTimeout(() => setFocused(false), 200), []);
  const handleClear = useCallback(() => setQuery(''), []);

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
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign={isAr ? 'right' : 'left'}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
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
              <SearchResultRow
                key={product.id}
                product={product}
                isAr={isAr}
                currency={t('products.currency')}
                onPress={handleSelect}
              />
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
    backgroundColor: colors.bgLight,
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
  clearText: { fontSize: 14, color: colors.textMuted },
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
    color: colors.textMuted,
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
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '500' },
  resultPrice: { fontSize: 13, color: colors.primary, marginTop: 2 },
});