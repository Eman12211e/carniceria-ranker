import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | 'flagged' | 'reported';

interface QueueItem {
  id: string;
  shop_name: string;
  uploader_name: string | null;
  storage_path: string;
  report_count: number;
  auto_flagged: boolean;
  created_at: string;
}

interface PendingFlag {
  id: string;
  price_id: string;
  reason: string;
  created_at: string;
  prices: {
    price: number;
    shops: { name: string } | null;
    meat_cuts: { name_en: string; name_es: string } | null;
    price_unit: { abbreviation: string } | null;
  } | null;
}

const REJECT_REASONS = [
  { key: 'blurry', en: 'Too blurry', es: 'Muy borrosa' },
  { key: 'inappropriate', en: 'Inappropriate', es: 'Inapropiada' },
  { key: 'duplicate', en: 'Duplicate', es: 'Duplicada' },
  { key: 'not_relevant', en: 'Not relevant', es: 'No relevante' },
  { key: 'privacy', en: 'Privacy concern', es: 'Problema de privacidad' },
];

export default function ModerationDashboard() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [tab, setTab] = useState<'photos' | 'prices' | 'claims'>('photos');
  const [filter, setFilter] = useState<Filter>('all');
  const [photoQueue, setPhotoQueue] = useState<QueueItem[]>([]);
  const [priceFlags, setPriceFlags] = useState<PendingFlag[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [photosRes, flagsRes, claimsRes] = await Promise.all([
      supabase
        .from('photos')
        .select('id, shop_id, user_id, storage_path, report_count, auto_flagged, created_at, shops(name), profiles(display_name)')
        .eq('moderation', 'pending')
        .order('auto_flagged', { ascending: false })
        .order('report_count', { ascending: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('price_flags')
        .select('id, price_id, reason, created_at, prices(price, shops(name), meat_cuts(name_en, name_es), price_unit(abbreviation))')
        .eq('resolved', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('verification_requests')
        .select('*, profiles(display_name, phone), shops(name, address, city)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
    ]);

    setPhotoQueue(
      (photosRes.data ?? []).map((p: any) => ({
        id: p.id,
        shop_name: p.shops?.name ?? 'Unknown',
        uploader_name: p.profiles?.display_name,
        storage_path: p.storage_path,
        report_count: p.report_count,
        auto_flagged: p.auto_flagged,
        created_at: p.created_at,
      }))
    );
    setPriceFlags(flagsRes.data ?? []);
    setClaims(claimsRes.data ?? []);
    setLoading(false);
  }

  async function handlePhotoAction(photoId: string, action: 'approved' | 'rejected', reason?: string) {
    const { error } = await supabase.rpc('moderate_photo', {
      p_photo_id: photoId,
      p_action: action,
      p_reject_reason: reason ?? null,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setPhotoQueue(photoQueue.filter((p) => p.id !== photoId));
  }

  async function handleResolveFlag(flagId: string) {
    await supabase
      .from('price_flags')
      .update({ resolved: true, resolved_by: (await supabase.auth.getUser()).data.user?.id })
      .eq('id', flagId);

    setPriceFlags(priceFlags.filter((f) => f.id !== flagId));
  }

  async function handleApproveClaim(requestId: string) {
    const { error } = await supabase.rpc('approve_shop_claim', {
      p_request_id: requestId,
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setClaims(claims.filter((c) => c.id !== requestId));
  }

  const filteredPhotos = photoQueue.filter((p) => {
    if (filter === 'flagged') return p.auto_flagged;
    if (filter === 'reported') return p.report_count >= 3;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Panel de Moderacion' : 'Moderation Dashboard'}
      </Text>

      {/* Stats bar */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{photoQueue.length}</Text>
          <Text style={styles.statLabel}>{isSpanish ? 'Fotos' : 'Photos'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{priceFlags.length}</Text>
          <Text style={styles.statLabel}>{isSpanish ? 'Precios' : 'Prices'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{claims.length}</Text>
          <Text style={styles.statLabel}>{isSpanish ? 'Reclamos' : 'Claims'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['photos', 'prices', 'claims'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'photos' ? (isSpanish ? 'Fotos' : 'Photos')
                : t === 'prices' ? (isSpanish ? 'Precios' : 'Prices')
                : (isSpanish ? 'Reclamos' : 'Claims')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Photo Queue */}
      {tab === 'photos' && (
        <>
          <View style={styles.filterRow}>
            {(['all', 'flagged', 'reported'] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.filterPill, filter === f && styles.filterActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all' ? (isSpanish ? 'Todas' : 'All')
                    : f === 'flagged' ? (isSpanish ? 'Auto-flag' : 'Auto-flagged')
                    : (isSpanish ? 'Reportadas' : 'Reported')}
                </Text>
              </Pressable>
            ))}
          </View>
          <FlatList
            data={filteredPhotos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.queueCard}>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueShop}>{item.shop_name}</Text>
                  <Text style={styles.queueMeta}>
                    {item.uploader_name ?? (isSpanish ? 'Anónimo' : 'Anonymous')}
                    {item.auto_flagged && ' | AUTO-FLAG'}
                    {item.report_count > 0 && ` | ${item.report_count} reports`}
                  </Text>
                </View>
                <View style={styles.queueActions}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => handlePhotoAction(item.id, 'approved')}
                  >
                    <Text style={styles.approveBtnText}>OK</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => {
                      Alert.alert(
                        isSpanish ? 'Razón de rechazo' : 'Reject reason',
                        '',
                        REJECT_REASONS.map((r) => ({
                          text: isSpanish ? r.es : r.en,
                          onPress: () => handlePhotoAction(item.id, 'rejected', r.key),
                        }))
                      );
                    }}
                  >
                    <Text style={styles.rejectBtnText}>X</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isSpanish ? 'Cola vacía' : 'Queue empty'}
              </Text>
            }
          />
        </>
      )}

      {/* Price Flags */}
      {tab === 'prices' && (
        <FlatList
          data={priceFlags}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.queueCard}>
              <View style={styles.queueInfo}>
                <Text style={styles.queueShop}>
                  {(item.prices as any)?.shops?.name ?? '?'} —{' '}
                  {isSpanish
                    ? (item.prices as any)?.meat_cuts?.name_es
                    : (item.prices as any)?.meat_cuts?.name_en}
                </Text>
                <Text style={styles.queueMeta}>
                  ${(item.prices as any)?.price?.toFixed(2)}/{(item.prices as any)?.price_unit?.abbreviation}
                  {' | '}{item.reason}
                </Text>
              </View>
              <Pressable
                style={styles.approveBtn}
                onPress={() => handleResolveFlag(item.id)}
              >
                <Text style={styles.approveBtnText}>
                  {isSpanish ? 'Resolver' : 'Resolve'}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isSpanish ? 'Sin reportes de precios' : 'No price flags'}
            </Text>
          }
        />
      )}

      {/* Shop Claims */}
      {tab === 'claims' && (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.queueCard}>
              <View style={styles.queueInfo}>
                <Text style={styles.queueShop}>{item.shops?.name}</Text>
                <Text style={styles.queueMeta}>
                  {item.profiles?.display_name} | {item.phone}
                  {item.otp_verified ? ' | OTP OK' : ' | OTP pending'}
                  {item.address_confirmed ? ' | Addr OK' : ''}
                </Text>
              </View>
              <Pressable
                style={[styles.approveBtn, !item.otp_verified && styles.btnDisabled]}
                onPress={() => handleApproveClaim(item.id)}
                disabled={!item.otp_verified}
              >
                <Text style={styles.approveBtnText}>
                  {isSpanish ? 'Aprobar' : 'Approve'}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isSpanish ? 'Sin reclamos pendientes' : 'No pending claims'}
            </Text>
          }
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
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  tabActive: {
    backgroundColor: '#e94560',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
  },
  filterText: {
    color: '#888',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#e94560',
  },
  queueCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueInfo: {
    flex: 1,
  },
  queueShop: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  queueMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#4ecca3',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  emptyText: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
