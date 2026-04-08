import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface ExpansionDashboardProps {
  userRole: string;
}

interface ExpansionMetrics {
  mau: number;
  verified_shops: number;
  price_freshness: number;
  share_virality: number;
}

const CITIES = ['Merced', 'Fresno', 'Stockton'] as const;
type City = (typeof CITIES)[number];

const THRESHOLDS = {
  mau: 500,
  verified_shops: 15,
  price_freshness: 80,
  share_virality: 5,
};

export default function ExpansionDashboard({ userRole }: ExpansionDashboardProps) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [selectedCity, setSelectedCity] = useState<City>('Merced');
  const [metrics, setMetrics] = useState<ExpansionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'admin') {
      loadMetrics();
    }
  }, [selectedCity, userRole]);

  async function loadMetrics() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_expansion_readiness', {
      p_city: selectedCity,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMetrics(data as ExpansionMetrics);
    }
    setLoading(false);
  }

  function isReady(): boolean {
    if (!metrics) return false;
    return (
      metrics.mau >= THRESHOLDS.mau &&
      metrics.verified_shops >= THRESHOLDS.verified_shops &&
      metrics.price_freshness >= THRESHOLDS.price_freshness &&
      metrics.share_virality >= THRESHOLDS.share_virality
    );
  }

  function progressColor(current: number, target: number): string {
    const pct = (current / target) * 100;
    if (pct >= 100) return '#4ecca3';
    if (pct >= 60) return '#f0a500';
    return '#e94560';
  }

  function pctColor(value: number, threshold: number): string {
    if (value >= threshold) return '#4ecca3';
    if (value >= threshold * 0.75) return '#f0a500';
    return '#e94560';
  }

  // Access denied for non-admins
  if (userRole !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.accessDenied}>
          {isSpanish ? 'Acceso denegado' : 'Access Denied'}
        </Text>
        <Text style={styles.accessDeniedSub}>
          {isSpanish
            ? 'Se requiere rol de administrador.'
            : 'Admin role required.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Panel de Expansión' : 'Expansion Dashboard'}
      </Text>

      {/* City Selector */}
      <View style={styles.cityRow}>
        {CITIES.map((city) => (
          <Pressable
            key={city}
            style={[
              styles.cityBtn,
              selectedCity === city && styles.cityBtnActive,
            ]}
            onPress={() => setSelectedCity(city)}
          >
            <Text
              style={[
                styles.cityBtnText,
                selectedCity === city && styles.cityBtnTextActive,
              ]}
            >
              {city}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : metrics ? (
        <>
          {/* Overall Readiness */}
          <View style={[styles.readinessCard, isReady() ? styles.readyCard : styles.notReadyCard]}>
            <Text style={styles.readinessIcon}>
              {isReady() ? '✓' : '✗'}
            </Text>
            <Text style={styles.readinessText}>
              {isReady()
                ? isSpanish
                  ? 'Listo para expandir'
                  : 'Ready to Expand'
                : isSpanish
                  ? 'No listo para expandir'
                  : 'Not Ready to Expand'}
            </Text>
          </View>

          {/* Metric Cards */}
          <View style={styles.metricsGrid}>
            {/* MAU */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                {isSpanish ? 'Usuarios Activos Mensuales' : 'Monthly Active Users'}
              </Text>
              <Text style={styles.metricValue}>
                <Text style={{ color: progressColor(metrics.mau, THRESHOLDS.mau) }}>
                  {metrics.mau}
                </Text>
                <Text style={styles.metricTarget}> / {THRESHOLDS.mau}</Text>
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, (metrics.mau / THRESHOLDS.mau) * 100)}%`,
                      backgroundColor: progressColor(metrics.mau, THRESHOLDS.mau),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Verified Shops */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                {isSpanish ? 'Tiendas Verificadas' : 'Verified Shops'}
              </Text>
              <Text style={styles.metricValue}>
                <Text
                  style={{
                    color: progressColor(metrics.verified_shops, THRESHOLDS.verified_shops),
                  }}
                >
                  {metrics.verified_shops}
                </Text>
                <Text style={styles.metricTarget}> / {THRESHOLDS.verified_shops}</Text>
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        (metrics.verified_shops / THRESHOLDS.verified_shops) * 100,
                      )}%`,
                      backgroundColor: progressColor(
                        metrics.verified_shops,
                        THRESHOLDS.verified_shops,
                      ),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Price Freshness */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                {isSpanish ? 'Frescura de Precios' : 'Price Freshness'}
              </Text>
              <Text
                style={[
                  styles.metricPct,
                  { color: pctColor(metrics.price_freshness, THRESHOLDS.price_freshness) },
                ]}
              >
                {metrics.price_freshness}%
              </Text>
              <Text style={styles.metricThreshold}>
                {isSpanish ? 'Objetivo' : 'Target'}: {THRESHOLDS.price_freshness}%
              </Text>
            </View>

            {/* Share Virality */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                {isSpanish ? 'Viralidad de Compartir' : 'Share Virality'}
              </Text>
              <Text
                style={[
                  styles.metricPct,
                  { color: pctColor(metrics.share_virality, THRESHOLDS.share_virality) },
                ]}
              >
                {metrics.share_virality}%
              </Text>
              <Text style={styles.metricThreshold}>
                {isSpanish ? 'Objetivo' : 'Target'}: {THRESHOLDS.share_virality}%
              </Text>
            </View>
          </View>

          {/* Expansion Playbook Summary */}
          <Text style={styles.sectionHeader}>
            {isSpanish ? 'Protocolo de Expansión' : 'Expansion Playbook'}
          </Text>

          <View style={styles.playbookCard}>
            <Text style={styles.playbookTitle}>
              {isSpanish ? 'Requisitos (todos deben cumplirse)' : 'Requirements (ALL must be met)'}
            </Text>
            <View style={styles.playbookItem}>
              <Text style={styles.playbookBullet}>
                {metrics.mau >= THRESHOLDS.mau ? '✓' : '○'}
              </Text>
              <Text style={styles.playbookText}>
                MAU {'>'}= {THRESHOLDS.mau}
              </Text>
            </View>
            <View style={styles.playbookItem}>
              <Text style={styles.playbookBullet}>
                {metrics.verified_shops >= THRESHOLDS.verified_shops ? '✓' : '○'}
              </Text>
              <Text style={styles.playbookText}>
                {isSpanish ? 'Tiendas verificadas' : 'Verified shops'} {'>'}={' '}
                {THRESHOLDS.verified_shops}
              </Text>
            </View>
            <View style={styles.playbookItem}>
              <Text style={styles.playbookBullet}>
                {metrics.price_freshness >= THRESHOLDS.price_freshness ? '✓' : '○'}
              </Text>
              <Text style={styles.playbookText}>
                {isSpanish ? 'Frescura de precios' : 'Price freshness'} {'>'}={' '}
                {THRESHOLDS.price_freshness}%
              </Text>
            </View>
            <View style={styles.playbookItem}>
              <Text style={styles.playbookBullet}>
                {metrics.share_virality >= THRESHOLDS.share_virality ? '✓' : '○'}
              </Text>
              <Text style={styles.playbookText}>
                {isSpanish ? 'Viralidad de compartir' : 'Share virality'} {'>'}={' '}
                {THRESHOLDS.share_virality}%
              </Text>
            </View>

            <View style={styles.playbookDivider} />

            <Text style={styles.playbookSubtitle}>
              {isSpanish ? 'Pasos previos al lanzamiento' : 'Pre-launch Steps'}
            </Text>
            <Text style={styles.playbookStep}>
              1. {isSpanish
                ? 'Visitar 10 carnicerías, fotografiar tableros de precios'
                : 'Visit 10 shops, photograph price boards'}
            </Text>
            <Text style={styles.playbookStep}>
              2. {isSpanish
                ? 'Sembrar precios para 10 tiendas'
                : 'Seed prices for 10 shops'}
            </Text>
            <Text style={styles.playbookStep}>
              3. {isSpanish
                ? 'Reclutar 3 dueños de carnicería en persona'
                : 'Recruit 3 butcher owners via in-person visits'}
            </Text>
            <Text style={styles.playbookStep}>
              4. {isSpanish
                ? 'Reclutar 5 usuarios activos con conexiones en la ciudad objetivo'
                : 'Recruit 5 power users with connections in target city'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {isSpanish
              ? 'No se pudieron cargar las métricas'
              : 'Could not load metrics'}
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: 1,
  },
  accessDenied: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e94560',
    marginBottom: 8,
  },
  accessDeniedSub: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  cityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  cityBtn: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cityBtnActive: {
    backgroundColor: '#e94560',
  },
  cityBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  cityBtnTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  readinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  readyCard: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 204, 163, 0.3)',
  },
  notReadyCard: {
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  readinessIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  readinessText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f5f5',
  },
  metricsGrid: {
    marginTop: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  metricLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  metricTarget: {
    fontSize: 16,
    color: '#555',
    fontWeight: '400',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2a2a3e',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  metricPct: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricThreshold: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  playbookCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  playbookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f5f5',
    marginBottom: 12,
  },
  playbookSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5f5f5',
    marginBottom: 10,
  },
  playbookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  playbookBullet: {
    fontSize: 16,
    color: '#4ecca3',
    width: 20,
    textAlign: 'center',
  },
  playbookText: {
    fontSize: 14,
    color: '#f5f5f5',
    flex: 1,
  },
  playbookDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a3e',
    marginVertical: 14,
  },
  playbookStep: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
  },
  emptyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  bottomPadding: {
    height: 40,
  },
});
