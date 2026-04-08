import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import ScoreBadgeBar from '@/components/ScoreBadgeBar';
import ScoreBadgeCompact from '@/components/ScoreBadgeCompact';
import FreshnessBadge from '@/components/FreshnessBadge';
import PriceTrend from '@/components/PriceTrend';
import EmptyState from '@/components/EmptyState';

interface ShopDetailProps {
  shopId: string;
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ShopDetailScreen({ shopId }: ShopDetailProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const dayNames = isSpanish ? DAY_NAMES_ES : DAY_NAMES_EN;

  const [shop, setShop] = useState<any>(null);
  const [hours, setHours] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  useEffect(() => {
    loadShop();
  }, [shopId]);

  async function loadShop() {
    const [shopRes, hoursRes, pricesRes, reviewsRes] = await Promise.all([
      supabase.from('shops').select('*').eq('id', shopId).single(),
      supabase.from('shop_hours').select('*').eq('shop_id', shopId).order('day_of_week'),
      supabase
        .from('current_prices')
        .select('*, meat_cuts(name_en, name_es, animal), price_unit(abbreviation, name_en, name_es)')
        .eq('shop_id', shopId),
      supabase.from('reviews').select('*, profiles(display_name)').eq('shop_id', shopId).order('created_at', { ascending: false }),
    ]);

    setShop(shopRes.data);
    setHours(hoursRes.data ?? []);
    setPrices(pricesRes.data ?? []);
    setReviews(reviewsRes.data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
      </View>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>{shop.name}</Text>
        <Text style={styles.shopAddress}>{shop.address}, {shop.city}</Text>
        {shop.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>{t('shop.verified')}</Text>
          </View>
        )}
      </View>

      {/* Score + Tooltip */}
      <Pressable
        style={styles.scoreSection}
        onPress={() => setShowScoreTooltip(!showScoreTooltip)}
      >
        <ScoreBadgeCompact
          priceScore={null}
          qualityScore={avgRating}
          consistencyScore={null}
        />
        {showScoreTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>
              {isSpanish ? 'Cómo calculamos la puntuación' : 'How we calculate scores'}
            </Text>
            <Text style={styles.tooltipText}>
              {isSpanish
                ? '• Precio: Comparado contra el promedio local\n• Calidad: Promedio de calificaciones de usuarios\n• Consistencia: Estabilidad de precios en 30 días'
                : '• Price: Compared against local average\n• Quality: Average of user ratings\n• Consistency: 30-day price stability'}
            </Text>
          </View>
        )}
      </Pressable>

      <ScoreBadgeBar
        priceScore={null}
        qualityScore={avgRating}
        consistencyScore={null}
      />

      {/* Quick actions */}
      <View style={styles.actions}>
        {shop.phone && (
          <Pressable
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${shop.phone}`)}
          >
            <Text style={styles.actionText}>{t('shop.call')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>{t('shop.directions')}</Text>
        </Pressable>
      </View>

      {/* Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('shop.hours')}</Text>
        {hours.length === 0 ? (
          <EmptyState
            title={isSpanish ? 'Sin horario' : 'No hours listed'}
            body={isSpanish ? 'Este negocio no ha agregado su horario.' : 'This shop hasn\'t added their hours yet.'}
          />
        ) : (
          hours.map((h) => (
            <View key={h.day_of_week} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{dayNames[h.day_of_week]}</Text>
              <Text style={styles.hoursTime}>
                {h.open_time
                  ? `${h.open_time} – ${h.close_time}`
                  : isSpanish ? 'Cerrado' : 'Closed'}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Prices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('shop.prices')}</Text>
        {prices.length === 0 ? (
          <EmptyState
            icon="$"
            title={isSpanish ? 'Sin precios aún' : 'No prices yet'}
            body={isSpanish
              ? 'Sé el primero en reportar un precio.'
              : 'Be the first to report a price.'}
          />
        ) : (
          prices.map((p: any) => (
            <View key={p.id} style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceCut}>
                  {isSpanish ? p.meat_cuts?.name_es : p.meat_cuts?.name_en}
                </Text>
                <Text style={styles.priceAnimal}>{p.meat_cuts?.animal}</Text>
              </View>
              <PriceTrend
                currentPrice={p.price}
                previousPrice={null}
                unit={p.price_unit?.abbreviation ?? 'lb'}
              />
            </View>
          ))
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shop.reviews')} ({reviews.length})
        </Text>
        {reviews.length === 0 ? (
          <EmptyState
            title={isSpanish ? 'Sin reseñas aún' : 'No reviews yet'}
            body={isSpanish
              ? 'Comparte tu experiencia con esta tienda.'
              : 'Share your experience with this shop.'}
            ctaLabel={t('review.writeReview')}
            onCtaPress={() => {}}
          />
        ) : (
          reviews.slice(0, 5).map((r: any) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>
                  {r.profiles?.display_name ?? (isSpanish ? 'Anónimo' : 'Anonymous')}
                </Text>
                <Text style={styles.reviewRating}>
                  {'*'.repeat(r.rating)}{'*'.repeat(5 - r.rating)}
                </Text>
              </View>
              {r.comment && (
                <Text style={styles.reviewComment}>{r.comment}</Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Photos placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('shop.photos')}</Text>
        <EmptyState
          title={isSpanish ? 'Sin fotos aún' : 'No photos yet'}
          body={isSpanish
            ? 'Agrega una foto de esta tienda.'
            : 'Add a photo of this shop.'}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingTop: 60,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e94560',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  shopName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  shopAddress: {
    fontSize: 15,
    color: '#888',
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedText: {
    color: '#4ecca3',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tooltip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  tooltipText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  hoursDay: {
    color: '#aaa',
    fontSize: 14,
    width: 40,
  },
  hoursTime: {
    color: '#fff',
    fontSize: 14,
  },
  priceRow: {
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  priceCut: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceAnimal: {
    color: '#e94560',
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  reviewCard: {
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewAuthor: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewRating: {
    color: '#f0c040',
    fontSize: 14,
  },
  reviewComment: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
