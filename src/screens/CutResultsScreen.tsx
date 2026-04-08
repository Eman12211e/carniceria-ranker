import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import PriceTrend from '@/components/PriceTrend';
import FreshnessBadge from '@/components/FreshnessBadge';
import ScoreBadgeCompact from '@/components/ScoreBadgeCompact';
import EmptyState from '@/components/EmptyState';

interface Props {
  cutId: string;
  cutNameEn: string;
  cutNameEs: string;
  animal: string;
}

interface ShopResult {
  shop_id: string;
  shop_name: string;
  shop_address: string;
  shop_city: string;
  shop_verified: boolean;
  distance_miles: number;
  price: number;
  unit: string;
  unit_id: string;
  price_id: string;
  recorded_at: string;
  freshness_status: string;
  avg_rating: number;
  review_count: number;
}

export default function CutResultsScreen({ cutId, cutNameEn, cutNameEs, animal }: Props) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const { location, loading: locLoading } = useLocation();

  const [results, setResults] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!location) return;
    loadResults();
  }, [location]);

  async function loadResults() {
    setLoading(true);
    const { data } = await supabase.rpc('search_cut_prices', {
      p_cut_id: cutId,
      p_user_lat: location!.latitude,
      p_user_lng: location!.longitude,
    });

    const shops = (data ?? []) as ShopResult[];
    setResults(shops);

    if (shops.length > 0) {
      const avg = shops.reduce((sum, s) => sum + s.price, 0) / shops.length;
      setAvgPrice(avg);
    }
    setLoading(false);
  }

  if (locLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const cutName = isSpanish ? cutNameEs : cutNameEn;
  const cutNameAlt = isSpanish ? cutNameEn : cutNameEs;

  return (
    <View style={styles.container}>
      {/* Cut header */}
      <View style={styles.header}>
        <Text style={styles.cutName}>{cutName}</Text>
        <Text style={styles.cutNameAlt}>{cutNameAlt}</Text>
        <Text style={styles.animal}>{animal}</Text>
        {avgPrice !== null && (
          <Text style={styles.avgPrice}>
            {isSpanish ? 'Promedio local:' : 'Local avg:'} ${avgPrice.toFixed(2)}/lb
          </Text>
        )}
        <Text style={styles.resultCount}>
          {results.length} {results.length === 1
            ? (isSpanish ? 'tienda' : 'shop')
            : (isSpanish ? 'tiendas' : 'shops')}
          {' '}{isSpanish ? 'dentro de 5 mi' : 'within 5 mi'}
        </Text>
      </View>

      {results.length === 0 ? (
        <EmptyState
          title={isSpanish
            ? `Ninguna tienda cerca tiene ${cutName}`
            : `No shops near you carry ${cutName}`}
          body={isSpanish
            ? 'Configura una alerta y te avisamos cuando aparezca.'
            : 'Set a price alert and we\'ll notify you when it appears.'}
          ctaLabel={isSpanish ? 'Crear alerta' : 'Set alert'}
          onCtaPress={() => {}}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.shop_id}-${item.unit_id}`}
          renderItem={({ item, index }) => {
            const isCheapest = index === 0;
            const savingsVsAvg = avgPrice ? avgPrice - item.price : 0;

            return (
              <Pressable style={[styles.shopCard, isCheapest && styles.shopCardBest]}>
                {isCheapest && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>
                      {isSpanish ? 'MEJOR PRECIO' : 'BEST PRICE'}
                    </Text>
                  </View>
                )}

                <View style={styles.shopRow}>
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{item.shop_name}</Text>
                    <Text style={styles.shopAddress}>
                      {item.shop_address}, {item.shop_city}
                    </Text>
                    <View style={styles.shopMeta}>
                      <Text style={styles.distance}>{item.distance_miles} mi</Text>
                      {item.shop_verified && (
                        <Text style={styles.verified}>{t('shop.verified')}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.priceSection}>
                    <PriceTrend
                      currentPrice={item.price}
                      previousPrice={null}
                      unit={item.unit}
                    />
                    {savingsVsAvg > 0.01 && (
                      <Text style={styles.savings}>
                        -${savingsVsAvg.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.shopFooter}>
                  <FreshnessBadge
                    status={item.freshness_status as any}
                    daysSinceUpdate={Math.floor(
                      (Date.now() - new Date(item.recorded_at).getTime()) / 86400000
                    )}
                  />
                  {item.review_count > 0 && (
                    <Text style={styles.rating}>
                      {item.avg_rating.toFixed(1)} ({item.review_count})
                    </Text>
                  )}
                </View>

                {/* Share + Flag actions */}
                <View style={styles.actionRow}>
                  <Pressable style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>
                      {isSpanish ? 'Compartir ahorro' : 'Share savings'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.flagBtn}>
                    <Text style={styles.flagBtnText}>
                      {isSpanish ? 'Reportar' : 'Flag'}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
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
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cutName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  cutNameAlt: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  animal: {
    fontSize: 12,
    color: '#e94560',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 4,
  },
  avgPrice: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  resultCount: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  shopCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
  },
  shopCardBest: {
    borderWidth: 1,
    borderColor: '#4ecca3',
  },
  bestBadge: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bestBadgeText: {
    color: '#4ecca3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  shopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
    marginRight: 12,
  },
  shopName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  shopAddress: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  shopMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  distance: {
    fontSize: 12,
    color: '#e94560',
    fontWeight: '600',
  },
  verified: {
    fontSize: 12,
    color: '#4ecca3',
    fontWeight: '600',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  savings: {
    fontSize: 13,
    color: '#4ecca3',
    fontWeight: '700',
    marginTop: 2,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  rating: {
    fontSize: 13,
    color: '#f0c040',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(78, 204, 163, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#4ecca3',
    fontSize: 13,
    fontWeight: '600',
  },
  flagBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  flagBtnText: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '600',
  },
});
