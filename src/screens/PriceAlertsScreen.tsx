import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import EmptyState from '@/components/EmptyState';

interface AlertItem {
  alert_id: string;
  cut_name_en: string;
  cut_name_es: string;
  animal: string;
  unit: string;
  target_price: number;
  current_best_price: number | null;
  current_best_shop: string | null;
  is_triggered: boolean;
  created_at: string;
}

export default function PriceAlertsScreen() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const { location } = useLocation();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    const { data } = await supabase.rpc('get_my_alerts');
    setAlerts((data ?? []) as AlertItem[]);
    setLoading(false);
  }

  async function handleDelete(alertId: string) {
    await supabase
      .from('price_alerts')
      .update({ active: false })
      .eq('id', alertId);
    setAlerts(alerts.filter((a) => a.alert_id !== alertId));
  }

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
        {isSpanish ? 'Mis Alertas de Precio' : 'My Price Alerts'}
      </Text>
      <Text style={styles.subtitle}>
        {isSpanish
          ? 'Te avisamos cuando un corte baje del precio que elijas.'
          : 'We\'ll notify you when a cut drops below your target price.'}
      </Text>

      {alerts.length === 0 ? (
        <EmptyState
          title={isSpanish ? 'Sin alertas' : 'No alerts'}
          body={isSpanish
            ? 'Busca un corte y toca "Crear alerta" para recibir notificaciones cuando baje de precio.'
            : 'Search a cut and tap "Set alert" to get notified when the price drops.'}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.alert_id}
          renderItem={({ item }) => {
            const cutName = isSpanish ? item.cut_name_es : item.cut_name_en;
            const triggered = item.is_triggered;

            return (
              <View style={[styles.alertCard, triggered && styles.alertTriggered]}>
                {triggered && (
                  <View style={styles.triggeredBadge}>
                    <Text style={styles.triggeredText}>
                      {isSpanish ? 'DISPONIBLE' : 'AVAILABLE'}
                    </Text>
                  </View>
                )}

                <View style={styles.alertRow}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertCut}>{cutName}</Text>
                    <Text style={styles.alertAnimal}>{item.animal}</Text>
                    <Text style={styles.alertTarget}>
                      {isSpanish ? 'Meta:' : 'Target:'} ${item.target_price.toFixed(2)}/{item.unit}
                    </Text>
                  </View>

                  <View style={styles.alertPriceCol}>
                    {item.current_best_price !== null ? (
                      <>
                        <Text style={[
                          styles.bestPrice,
                          { color: triggered ? '#4ecca3' : '#fff' },
                        ]}>
                          ${item.current_best_price.toFixed(2)}
                        </Text>
                        <Text style={styles.bestShop}>
                          {item.current_best_shop}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noPrice}>
                        {isSpanish ? 'Sin datos' : 'No data'}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.alertActions}>
                  {triggered && item.current_best_shop && (
                    <Pressable style={styles.goBtn}>
                      <Text style={styles.goBtnText}>
                        {isSpanish ? 'Ver tienda' : 'View shop'}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.alert_id)}
                  >
                    <Text style={styles.deleteBtnText}>
                      {isSpanish ? 'Eliminar' : 'Remove'}
                    </Text>
                  </Pressable>
                </View>
              </View>
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
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alertTriggered: {
    borderWidth: 1,
    borderColor: '#4ecca3',
  },
  triggeredBadge: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  triggeredText: {
    color: '#4ecca3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertInfo: {
    flex: 1,
  },
  alertCut: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  alertAnimal: {
    fontSize: 11,
    color: '#e94560',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  alertTarget: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  alertPriceCol: {
    alignItems: 'flex-end',
  },
  bestPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  bestShop: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  noPrice: {
    fontSize: 14,
    color: '#555',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    paddingTop: 10,
  },
  goBtn: {
    flex: 1,
    backgroundColor: 'rgba(78, 204, 163, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  goBtnText: {
    color: '#4ecca3',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  deleteBtnText: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '600',
  },
});
