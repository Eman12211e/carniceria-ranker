import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface HealthData {
  checked_at: string;
  shop_freshness_last_refresh: string | null;
  price_averages_rows: number;
  prices_24h: number;
  reviews_24h: number;
  photos_pending: number;
  analytics_events_24h: number;
  total_users: number;
  shoppers: number;
  butchers: number;
  admins: number;
  trial_users: number;
  pro_users: number;
  total_shops: number;
  verified_shops: number;
  claimed_shops: number;
  abuse_log_unresolved: number;
  abuse_log_critical: number;
  abuse_log_high: number;
  notifications_pending: number;
  price_alerts_active: number;
  deep_links_7d: number;
  cron_jobs: Array<{ jobname: string; schedule: string; active: boolean }> | null;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SystemHealthScreen() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role ?? null);

      if (profile?.role === 'admin') {
        const { data, error } = await supabase.rpc('get_system_health');
        if (!error && data) {
          setHealth(data as unknown as HealthData);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHealth();
    setRefreshing(false);
  }, [fetchHealth]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (userRole !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedMsg}>This screen is for administrators only.</Text>
      </View>
    );
  }

  if (!health) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load health data</Text>
      </View>
    );
  }

  const alertColor =
    health.abuse_log_critical > 0 ? '#e94560' :
    health.abuse_log_high > 0 ? '#f0a500' : '#4ecca3';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
    >
      <Text style={styles.header}>System Health</Text>
      <Text style={styles.timestamp}>
        Last checked: {new Date(health.checked_at).toLocaleString()}
      </Text>

      {/* Data Volume 24h */}
      <Text style={styles.sectionHeader}>Data Volume (24h)</Text>
      <View style={styles.statGrid}>
        <StatCard label="Prices" value={health.prices_24h} />
        <StatCard label="Reviews" value={health.reviews_24h} />
        <StatCard label="Analytics" value={health.analytics_events_24h} />
        <StatCard label="Photos Pending" value={health.photos_pending} color={health.photos_pending > 10 ? '#f0a500' : '#4ecca3'} />
      </View>

      {/* Users */}
      <Text style={styles.sectionHeader}>Users</Text>
      <View style={styles.statGrid}>
        <StatCard label="Total" value={health.total_users} />
        <StatCard label="Shoppers" value={health.shoppers} />
        <StatCard label="Butchers" value={health.butchers} />
        <StatCard label="Admins" value={health.admins} />
        <StatCard label="Trial" value={health.trial_users} color="#f0a500" />
        <StatCard label="Pro" value={health.pro_users} color="#4ecca3" />
      </View>

      {/* Shops */}
      <Text style={styles.sectionHeader}>Shops</Text>
      <View style={styles.statGrid}>
        <StatCard label="Active" value={health.total_shops} />
        <StatCard label="Verified" value={health.verified_shops} color="#4ecca3" />
        <StatCard label="Claimed" value={health.claimed_shops} />
      </View>

      {/* Alerts & Monitoring */}
      <Text style={styles.sectionHeader}>Alerts & Monitoring</Text>
      <View style={styles.statGrid}>
        <StatCard label="Unresolved Abuse" value={health.abuse_log_unresolved} color={alertColor} />
        <StatCard label="Critical" value={health.abuse_log_critical} color={health.abuse_log_critical > 0 ? '#e94560' : '#4ecca3'} />
        <StatCard label="High" value={health.abuse_log_high} color={health.abuse_log_high > 0 ? '#f0a500' : '#4ecca3'} />
        <StatCard label="Pending Notifs" value={health.notifications_pending} />
        <StatCard label="Active Alerts" value={health.price_alerts_active} />
        <StatCard label="Deep Links (7d)" value={health.deep_links_7d} />
      </View>

      {/* Cron Jobs */}
      <Text style={styles.sectionHeader}>Cron Jobs</Text>
      {health.cron_jobs && health.cron_jobs.length > 0 ? (
        health.cron_jobs.map((job, i) => (
          <View key={i} style={styles.cronRow}>
            <View style={[styles.cronDot, { backgroundColor: job.active ? '#4ecca3' : '#e94560' }]} />
            <View style={styles.cronInfo}>
              <Text style={styles.cronName}>{job.jobname}</Text>
              <Text style={styles.cronSchedule}>{job.schedule}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No cron jobs found</Text>
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
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f5f5f5',
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 4,
    textAlign: 'center',
  },
  cronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  cronDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  cronInfo: {
    flex: 1,
  },
  cronName: {
    fontSize: 14,
    color: '#f5f5f5',
    fontWeight: '500',
  },
  cronSchedule: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e94560',
    marginBottom: 8,
  },
  accessDeniedMsg: {
    fontSize: 15,
    color: '#a0a0a0',
  },
  errorText: {
    fontSize: 16,
    color: '#e94560',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
