import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getProduct, type Product } from '@/services/products';
import { getReviews, addReview, deleteReview, hasPurchased, getProductRating, type Review, type ProductRating } from '@/services/reviews';
import { useAuth } from '@/hooks/useAuth';
import { useIsAr, getProductName, getProductDesc, getProductRealName } from '@/lib/helpers';
import { sharedStyles, colors } from '@/lib/theme';
import { Footer } from '@/components/Footer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProductImage } from '@/components/ProductImage';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const isAr = useIsAr();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productRating, setProductRating] = useState<ProductRating | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [p, r, pr] = await Promise.all([getProduct(id), getReviews(id), getProductRating(id)]);
      setProduct(p);
      setReviews(r);
      setProductRating(pr);

      // Check if current user can review (purchased + not already reviewed)
      if (user) {
        const purchased = await hasPurchased(id);
        const alreadyReviewed = r.some((rev) => rev.user_id === user.id);
        setCanReview(purchased && !alreadyReviewed);
      } else {
        setCanReview(false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert(t('reviews.failed'), t('reviews.comment'));
      return;
    }
    setSubmitting(true);
    try {
      await addReview(id, rating, comment);
      Alert.alert(t('reviews.success'));
      setShowForm(false);
      setComment('');
      setRating(5);
      await loadData();
    } catch (err: any) {
      const msg = err?.message ?? t('reviews.failed');
      Alert.alert(t('reviews.failed'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      t('reviews.deleteReview'),
      t('reviews.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(reviewId);
              Alert.alert(t('reviews.deleted'));
              await loadData();
            } catch {
              Alert.alert(t('reviews.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('products.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('nav.home')}</Text>
        </Pressable>
      </View>
    );
  }

  const description = getProductDesc(product, isAr);
  const myReview = reviews.find((r) => user && r.user_id === user.id);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgDark }}
      contentContainerStyle={sharedStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title={t('nav.home')} />

      {/* Product image */}
      <View style={styles.imageWrap}>
        <ProductImage
          product={product}
          style={styles.image}
          placeholderFontSize={48}
          placeholderBg="#F5F5F7"
        />
      </View>

      {/* Name + real name + price + rating */}
      <Text style={styles.name}>{getProductName(product, isAr)}</Text>
      {getProductRealName(product, isAr) && (
        <Text style={styles.realName}>{getProductRealName(product, isAr)}</Text>
      )}
      <Text style={styles.price}>
        {product.price.toFixed(2)} {t('products.currency')}
      </Text>
      {productRating && productRating.review_count > 0 && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStars}>
            {'★'.repeat(Math.floor(productRating.avg_rating))}
            {productRating.avg_rating - Math.floor(productRating.avg_rating) >= 0.25 &&
             productRating.avg_rating - Math.floor(productRating.avg_rating) < 0.75 ? '⯨' : ''}
            {'☆'.repeat(5 - Math.floor(productRating.avg_rating) -
              (productRating.avg_rating - Math.floor(productRating.avg_rating) >= 0.25 &&
               productRating.avg_rating - Math.floor(productRating.avg_rating) < 0.75 ? 1 : 0))}
          </Text>
          <Text style={styles.ratingSummary}>
            {productRating.avg_rating.toFixed(1)} · {productRating.review_count} {t('reviews.stars')}
          </Text>
        </View>
      )}

      {/* Description */}
      {description ? (
        <View style={styles.descSection}>
          <Text style={styles.descLabel}>{t('products.description')}</Text>
          <Text style={styles.descText}>{description}</Text>
        </View>
      ) : null}

      {/* Order entry points — Pay + Order Now */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.payButton, styles.buttonHalf]}
          onPress={() => router.push(`/(customer)/payment/${product.id}`)}
        >
          <Text style={styles.payButtonText}>{t('products.pay')}</Text>
        </Pressable>
        <Pressable
          style={[styles.orderButton, styles.buttonHalf]}
          onPress={() => router.push(`/(customer)/order/${product.id}`)}
        >
          <Text style={styles.orderButtonText}>{t('order.orderNow')}</Text>
        </Pressable>
      </View>

      {/* ---------- Reviews Section ---------- */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsTitle}>{t('reviews.title')}</Text>

        {/* Add review button / form */}
        {user ? (
          canReview && !showForm ? (
            <Pressable style={styles.addReviewBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addReviewBtnText}>{t('reviews.addReview')}</Text>
            </Pressable>
          ) : null
        ) : (
          <Text style={styles.loginHint}>{t('reviews.loginToReview')}</Text>
        )}

        {/* Review form */}
        {showForm ? (
          <View style={styles.form}>
            <Text style={sharedStyles.label}>{t('reviews.rating')}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Text style={[styles.star, n <= rating ? styles.starActive : styles.starInactive]}>
                    {'\u2605'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={sharedStyles.label}>{t('reviews.comment')}</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.formButtons}>
              <Pressable
                style={[styles.formBtn, styles.cancelBtn]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.formBtn, styles.submitBtn, submitting && sharedStyles.btnDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? t('reviews.submitting') : t('reviews.submit')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Existing reviews */}
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>{t('reviews.noReviews')}</Text>
        ) : (
          reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{rev.username ?? 'user'}</Text>
                <Text style={styles.reviewStars}>
                  {'\u2605'.repeat(rev.rating)}{'  '}
                  <Text style={styles.reviewRatingText}>{rev.rating} {t('reviews.stars')}</Text>
                </Text>
              </View>
              {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
              {user && rev.user_id === user.id ? (
                <Pressable
                  style={styles.deleteReviewBtn}
                  onPress={() => handleDeleteReview(rev.id)}
                >
                  <Text style={styles.deleteReviewText}>{t('reviews.deleteReview')}</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bgDark },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 4, color: colors.textLight },
  realName: { fontSize: 16, color: colors.textMuted, marginBottom: 8, fontStyle: 'italic' },
  price: { fontSize: 22, color: colors.brass, fontWeight: '600', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  ratingStars: { fontSize: 18, color: colors.rating, letterSpacing: -1 },
  ratingSummary: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  descSection: { marginBottom: 24 },
  descLabel: { fontSize: 14, fontWeight: '600', color: colors.textMid, marginBottom: 6 },
  descText: { fontSize: 16, lineHeight: 24, color: colors.textLight },
  payButton: {
    backgroundColor: colors.brass,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: { color: colors.bgDark, fontSize: 18, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  buttonHalf: { flex: 1 },
  orderButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: { color: colors.textLight, fontSize: 18, fontWeight: '700' },
  notFound: { fontSize: 18, color: colors.textMuted },
  backLink: { fontSize: 16, color: colors.brass },
  // ---- Reviews ----
  reviewsSection: { marginBottom: 24 },
  reviewsTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: colors.textLight },
  addReviewBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '600' },
  loginHint: { fontSize: 14, color: colors.textMuted, marginBottom: 16, fontStyle: 'italic' },
  form: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  star: { fontSize: 32 },
  starActive: { color: colors.rating },
  starInactive: { color: colors.borderLight },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: colors.bgMid,
    color: colors.textLight,
    marginBottom: 12,
  },
  formButtons: { flexDirection: 'row', gap: 12 },
  formBtn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.bgLight },
  cancelBtnText: { color: colors.textMid, fontSize: 16, fontWeight: '600' },
  submitBtn: { backgroundColor: colors.brass },
  submitBtnText: { color: colors.bgDark, fontSize: 16, fontWeight: '700' },
  noReviews: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  reviewCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewUser: { fontSize: 16, fontWeight: '600', color: colors.textLight },
  reviewStars: { fontSize: 16, color: colors.rating },
  reviewRatingText: { fontSize: 12, color: colors.textMuted },
  reviewComment: { fontSize: 15, lineHeight: 22, color: colors.textMid },
  deleteReviewBtn: { marginTop: 8, alignSelf: 'flex-end' },
  deleteReviewText: { fontSize: 14, color: colors.danger },
});