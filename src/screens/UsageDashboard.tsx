import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface UsageData {
  snapshot: {
    db_size_mb: number;
    index_size_mb: number;
    active_connections: number;
    storage_used_mb: number;
    table_sizes: Record<string, string>;
    row_counts: Record<string, number>;
    captured_at: string;
  } | null;
  free_tier_limits: {
    db_max_mb: number;
    storage_max_mb: number;
    edge_fn_max_calls: number;
    auth_mau_max: number;
    realtime_max_connections: number;
    bandwidth_max_gb: number;
  };
  alerts: Array<{ level: string; msg: string } | null>;
  key_metrics: {
    total_shops: number;
    total_prices: number;
    total_reviews: number;
    pending_photos: number;
    pending_flags: number;
    pending_claims: number;
    stale_shops: number;
  };
}

function UsageBar({ label, current, max, unit }: { label: string; current: number; max: number; unit: string }) {
  const pct = Math.min(100, (current / max) * 100);
  const color = pct >= 80 ? '#e94560' : pct >= 60 ? '#f0c040' : '#4ecca3';

  return (
    <View style={styles.usageBarContainer}>
      <View style={styles.usageBarHeader}>
        <Text style={styles.usageBarLabel}>{label}</Text>
        <Text style={[styles.usageBarValue, { color }]}>
          {current.toFixed(1)} / {max} {unit} ({pct.toFixed(0)}%)
        </Text>
      </View>
      <View style={styles.usageBarTrack}>
        <View style={[styles.usageBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function UsageDashboard() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: result } = await supabase.rpc('get_usage_dashboard');
    setData(result as unknown as UsageData);
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  const snap = data.snapshot;
  const metrics = data.key_metrics;
  const limits = data.free_tier_limits;
  const alerts = (data.alerts ?? []).filter(Boolean) as Array<{ level: string; msg: string }>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Panel de Uso — Supabase' : 'Usage Dashboard — Supabase'}
      </Text>

      {snap && (
        <Text style={styles.lastUpdated}>
          {isSpanish ? 'Último snapshot:' : 'Last snapshot:'}{' '}
          {new Date(snap.captured_at).toLocaleDateString()}
        </Text>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsSection}>
          {alerts.map((alert, i) => (
            <View key={i} style={[styles.alertBox, alert.level === 'warning' && styles.alertWarning]}>
              <Text style={styles.alertText}>{alert.msg}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Resource usage bars */}
      <Text style={styles.sectionTitle}>
        {isSpanish ? 'Recursos' : 'Resources'}
      </Text>

      <UsageBar
        label={isSpanish ? 'Base de datos' : 'Database'}
        current={snap?.db_size_mb ?? 0}
        max={limits.db_max_mb}
        unit="MB"
      />
      <UsageBar
        label={isSpanish ? 'Almacenamiento' : 'Storage'}
        current={snap?.storage_used_mb ?? 0}
        max={limits.storage_max_mb}
        unit="MB"
      />
      <UsageBar
        label={isSpanish ? 'Conexiones activas' : 'Active connections'}
        current={snap?.active_connections ?? 0}
        max={60}
        unit=""
      />

      {/* Key metrics */}
      <Text style={styles.sectionTitle}>
        {isSpanish ? 'Métricas clave' : 'Key Metrics'}
      </Text>

      <View style={styles.metricsGrid}>
        <MetricCard label={isSpanish ? 'Tiendas activas' : 'Active shops'} value={metrics.total_shops} />
        <MetricCard label={isSpanish ? 'Precios' : 'Prices'} value={metrics.total_prices} />
        <MetricCard label={isSpanish ? 'Reseñas' : 'Reviews'} value={metrics.total_reviews} />
        <MetricCard label={isSpanish ? 'Fotos pendientes' : 'Pending photos'} value={metrics.pending_photos} color={metrics.pending_photos > 50 ? '#e94560' : undefined} />
        <MetricCard label={isSpanish ? 'Reportes precio' : 'Price flags'} value={metrics.pending_flags} color={metrics.pending_flags > 10 ? '#f0c040' : undefined} />
        <MetricCard label={isSpanish ? 'Reclamos tienda' : 'Shop claims'} value={metrics.pending_claims} />
        <MetricCard label={isSpanish ? 'Tiendas obsoletas' : 'Stale shops'} value={metrics.stale_shops} color={metrics.stale_shops > 3 ? '#e94560' : undefined} />
      </View>

      {/* Table sizes (debug) */}
      {snap?.table_sizes && (
        <>
          <Text style={styles.sectionTitle}>
            {isSpanish ? 'Tamaño por tabla' : 'Table Sizes'}
          </Text>
          {Object.entries(snap.table_sizes).map(([table, size]) => (
            <View key={table} style={styles.tableRow}>
              <Text style={styles.tableName}>{table}</Text>
              <Text style={styles.tableSize}>{size}</Text>
            </View>
          ))}
        </>
      )}

      {/* Refresh */}
      <Pressable style={styles.refreshButton} onPress={loadData}>
        <Text style={styles.refreshText}>
          {isSpanish ? 'Actualizar' : 'Refresh'}
        </Text>
      </Pressable>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#555',
    marginBottom: 16,
  },
  alertsSection: {
    marginBottom: 16,
    gap: 8,
  },
  alertBox: {
    backgroundColor: 'rgba(240, 192, 64, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#f0c040',
    borderRadius: 8,
    padding: 12,
  },
  alertWarning: {
    borderLeftColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  alertText: {
    color: '#f0c040',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  usageBarContainer: {
    marginBottom: 14,
  },
  usageBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageBarLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  usageBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  usageBarTrack: {
    height: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 5,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    minWidth: '30%',
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e94560',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  tableName: {
    color: '#aaa',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  tableSize: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  refreshText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
