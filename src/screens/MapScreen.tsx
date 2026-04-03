import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@/hooks/useLocation';
import { useNearbyShops } from '@/hooks/useNearbyShops';

export default function MapScreen() {
  const { t } = useTranslation();
  const { location, loading: locLoading, error: locError } = useLocation();
  const {
    shops,
    loading: shopsLoading,
    isEmpty,
  } = useNearbyShops(location?.latitude ?? null, location?.longitude ?? null);

  if (locLoading || shopsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (locError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{locError}</Text>
      </View>
    );
  }

  // Ghost Mode: empty state when no shops exist nearby
  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.ghostIcon}>���</Text>
        <Text style={styles.ghostTitle}>{t('shop.noShopsGhostTitle')}</Text>
        <Text style={styles.ghostBody}>{t('shop.noShopsGhostBody')}</Text>
      </View>
    );
  }

  // TODO: Replace with react-native-maps MapView + shop markers
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {shops.length} {shops.length === 1 ? 'shop' : 'shops'} nearby
      </Text>
      {shops.map((shop) => (
        <View key={shop.id} style={styles.shopCard}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopAddress}>{shop.address}, {shop.city}</Text>
          <Text style={styles.shopDistance}>{shop.distance_miles} mi</Text>
          {shop.verified && (
            <Text style={styles.verified}>{t('shop.verified')}</Text>
          )}
        </View>
      ))}
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
    padding: 24,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#e94560',
    fontSize: 16,
    textAlign: 'center',
  },
  ghostIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  ghostTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  ghostBody: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  shopCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shopAddress: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  shopDistance: {
    fontSize: 14,
    color: '#e94560',
    marginTop: 4,
  },
  verified: {
    fontSize: 12,
    color: '#4ecca3',
    marginTop: 4,
  },
});
