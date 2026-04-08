import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface SubscriptionScreenProps {
  userId: string;
}

type SubscriptionStatus = 'free' | 'trial' | 'pro' | 'expired';

interface ProfileData {
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
}

const STRIPE_CHECKOUT_URL = 'https://checkout.stripe.com/placeholder';
const STRIPE_MANAGE_URL = 'https://billing.stripe.com/placeholder';

const FEATURES = [
  { key: 'listing', free: true, trial: true, pro: true },
  { key: 'search', free: 'basic', trial: 'basic', pro: 'priority' },
  { key: 'reviews', free: true, trial: true, pro: true },
  { key: 'uploadPrices', free: false, trial: true, pro: true },
  { key: 'updatePrices', free: false, trial: true, pro: 'unlimited' },
  { key: 'priceHistory', free: '7d', trial: '30d', pro: '90d' },
  { key: 'weeklyEmail', free: false, trial: 'basic', pro: 'full' },
  { key: 'shareCard', free: 'branded', trial: 'branded', pro: 'custom' },
  { key: 'verifiedBadge', free: false, trial: false, pro: true },
  { key: 'freshnessBoost', free: false, trial: false, pro: true },
  { key: 'priceAlerts', free: false, trial: false, pro: true },
  { key: 'analytics', free: false, trial: 'basic', pro: 'full' },
  { key: 'support', free: 'community', trial: 'email', pro: 'priority' },
] as const;

export default function SubscriptionScreen({ userId }: SubscriptionScreenProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      Alert.alert(
        isSpanish ? 'Error' : 'Error',
        error.message,
      );
    } else {
      setProfile(data as ProfileData);
    }
    setLoading(false);
  }

  function getTrialDaysRemaining(): number {
    if (!profile?.trial_ends_at) return 0;
    const now = new Date();
    const end = new Date(profile.trial_ends_at);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function handleUpgrade() {
    Linking.openURL(STRIPE_CHECKOUT_URL);
  }

  function handleManage() {
    Linking.openURL(STRIPE_MANAGE_URL);
  }

  async function handleRestore() {
    Alert.alert(
      isSpanish ? 'Restaurar compra' : 'Restore Purchase',
      isSpanish
        ? 'Si ya tienes una suscripción activa, contacta soporte para restaurarla.'
        : 'If you have an active subscription, contact support to restore it.',
    );
  }

  function getFeatureLabel(key: string): string {
    const labels: Record<string, { en: string; es: string }> = {
      listing: { en: 'Shop listing visible', es: 'Listado de tienda visible' },
      search: { en: 'Show in search results', es: 'Aparecer en búsqueda' },
      reviews: { en: 'Shopper reviews visible', es: 'Reseñas visibles' },
      uploadPrices: { en: 'Upload prices', es: 'Subir precios' },
      updatePrices: { en: 'Update prices', es: 'Actualizar precios' },
      priceHistory: { en: 'Price history', es: 'Historial de precios' },
      weeklyEmail: { en: 'Weekly performance email', es: 'Email semanal de rendimiento' },
      shareCard: { en: 'Share card branding', es: 'Marca en tarjeta compartida' },
      verifiedBadge: { en: '"Verified Pro" badge', es: 'Insignia "Pro Verificado"' },
      freshnessBoost: { en: 'Freshness boost in ranking', es: 'Impulso de frescura en ranking' },
      priceAlerts: { en: 'Price alerts to shoppers', es: 'Alertas de precio a compradores' },
      analytics: { en: 'Analytics dashboard', es: 'Panel de analíticas' },
      support: { en: 'Support', es: 'Soporte' },
    };
    return isSpanish ? labels[key]?.es ?? key : labels[key]?.en ?? key;
  }

  function renderCellValue(value: boolean | string): string {
    if (value === true) return '✓';
    if (value === false) return '—';
    const valueLabels: Record<string, { en: string; es: string }> = {
      basic: { en: 'Basic', es: 'Básico' },
      priority: { en: 'Priority', es: 'Prioritario' },
      unlimited: { en: 'Unlimited', es: 'Ilimitado' },
      full: { en: 'Full', es: 'Completo' },
      branded: { en: 'Branded', es: 'Con marca' },
      custom: { en: 'Custom', es: 'Personalizado' },
      community: { en: 'Community', es: 'Comunidad' },
      email: { en: 'Email', es: 'Email' },
    };
    if (valueLabels[value]) {
      return isSpanish ? valueLabels[value].es : valueLabels[value].en;
    }
    return String(value);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  const status = profile?.subscription_status ?? 'free';
  const daysLeft = getTrialDaysRemaining();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Suscripción' : 'Subscription'}
      </Text>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>
          {isSpanish ? 'Estado actual' : 'Current Status'}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, statusBadgeColor(status)]}>
            <Text style={styles.statusBadgeText}>
              {statusLabel(status, isSpanish)}
            </Text>
          </View>
        </View>

        {status === 'trial' && (
          <View style={styles.trialInfo}>
            <Text style={styles.trialDays}>
              {daysLeft} {isSpanish ? 'días restantes' : 'days remaining'}
            </Text>
            <View style={styles.trialBar}>
              <View
                style={[
                  styles.trialBarFill,
                  { width: `${Math.min(100, (daysLeft / 90) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.trialNote}>
              {isSpanish
                ? 'Tienes acceso completo a funciones Pro durante tu prueba.'
                : 'You have full access to Pro features during your trial.'}
            </Text>
          </View>
        )}

        {status === 'pro' && (
          <View style={styles.proInfo}>
            <Text style={styles.proText}>
              {isSpanish
                ? 'Suscripción Pro activa — $19/mes'
                : 'Active Pro Subscription — $19/mo'}
            </Text>
            <View style={styles.proButtons}>
              <Pressable style={styles.manageBtn} onPress={handleManage}>
                <Text style={styles.manageBtnText}>
                  {isSpanish ? 'Administrar' : 'Manage'}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={handleManage}>
                <Text style={styles.cancelBtnText}>
                  {isSpanish ? 'Cancelar' : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {(status === 'free' || status === 'expired') && (
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeText}>
              {isSpanish
                ? 'Desbloquea todas las funciones para hacer crecer tu negocio.'
                : 'Unlock all features to grow your business.'}
            </Text>
            <Pressable style={styles.upgradeBtn} onPress={handleUpgrade}>
              <Text style={styles.upgradeBtnText}>
                {isSpanish
                  ? 'Actualizar a Pro — $19/mes'
                  : 'Upgrade to Pro — $19/mo'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Feature Comparison */}
      <Text style={styles.sectionHeader}>
        {isSpanish ? 'Comparación de funciones' : 'Feature Comparison'}
      </Text>

      <View style={styles.tableCard}>
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.featureCol]}>
            {isSpanish ? 'Función' : 'Feature'}
          </Text>
          <Text style={styles.tableHeaderCell}>Free</Text>
          <Text style={styles.tableHeaderCell}>Trial</Text>
          <Text style={styles.tableHeaderCell}>Pro</Text>
        </View>

        {FEATURES.map((feat, idx) => (
          <View
            key={feat.key}
            style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
          >
            <Text style={[styles.tableCell, styles.featureCol]} numberOfLines={2}>
              {getFeatureLabel(feat.key)}
            </Text>
            <Text style={[styles.tableCell, cellStyle(feat.free)]}>
              {renderCellValue(feat.free)}
            </Text>
            <Text style={[styles.tableCell, cellStyle(feat.trial)]}>
              {renderCellValue(feat.trial)}
            </Text>
            <Text style={[styles.tableCell, cellStyle(feat.pro)]}>
              {renderCellValue(feat.pro)}
            </Text>
          </View>
        ))}
      </View>

      {/* Restore Purchase */}
      <Pressable style={styles.restoreBtn} onPress={handleRestore}>
        <Text style={styles.restoreBtnText}>
          {isSpanish ? 'Restaurar compra' : 'Restore Purchase'}
        </Text>
      </Pressable>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function statusLabel(status: SubscriptionStatus, isSpanish: boolean): string {
  const labels: Record<SubscriptionStatus, { en: string; es: string }> = {
    free: { en: 'Free', es: 'Gratis' },
    trial: { en: 'Free Trial', es: 'Prueba Gratis' },
    pro: { en: 'Pro', es: 'Pro' },
    expired: { en: 'Expired', es: 'Expirado' },
  };
  return isSpanish ? labels[status].es : labels[status].en;
}

function statusBadgeColor(status: SubscriptionStatus) {
  switch (status) {
    case 'pro':
      return { backgroundColor: '#4ecca3' };
    case 'trial':
      return { backgroundColor: '#e94560' };
    case 'expired':
      return { backgroundColor: '#666' };
    default:
      return { backgroundColor: '#444' };
  }
}

function cellStyle(value: boolean | string) {
  if (value === true) return { color: '#4ecca3' };
  if (value === false) return { color: '#555' };
  return { color: '#f5f5f5' };
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
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 1,
  },
  statusCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
  },
  statusLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  trialInfo: {
    marginTop: 8,
  },
  trialDays: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e94560',
    marginBottom: 8,
  },
  trialBar: {
    height: 6,
    backgroundColor: '#2a2a3e',
    borderRadius: 3,
    marginBottom: 12,
  },
  trialBarFill: {
    height: 6,
    backgroundColor: '#e94560',
    borderRadius: 3,
  },
  trialNote: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  proInfo: {
    marginTop: 8,
  },
  proText: {
    fontSize: 16,
    color: '#4ecca3',
    fontWeight: '600',
    marginBottom: 12,
  },
  proButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manageBtn: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manageBtnText: {
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeSection: {
    marginTop: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#16162a',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#a0a0a0',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a2a3e',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#f5f5f5',
    textAlign: 'center',
  },
  featureCol: {
    flex: 2,
    textAlign: 'left',
  },
  restoreBtn: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 14,
  },
  restoreBtnText: {
    color: '#a0a0a0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 40,
  },
});
