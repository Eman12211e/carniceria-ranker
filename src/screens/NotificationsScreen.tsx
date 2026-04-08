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
import EmptyState from '@/components/EmptyState';

interface Notification {
  id: string;
  type: string;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  data: Record<string, unknown>;
  sent: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notification_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }

  function typeIcon(type: string): string {
    switch (type) {
      case 'price_alert': return '$';
      case 'moderation_update': return 'i';
      case 'verification_update': return '*';
      default: return '!';
    }
  }

  function typeColor(type: string): string {
    switch (type) {
      case 'price_alert': return '#4ecca3';
      case 'moderation_update': return '#f0c040';
      case 'verification_update': return '#e94560';
      default: return '#888';
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
        {isSpanish ? 'Notificaciones' : 'Notifications'}
      </Text>

      {notifications.length === 0 ? (
        <EmptyState
          title={isSpanish ? 'Sin notificaciones' : 'No notifications'}
          body={isSpanish
            ? 'Aqui aparecerán tus alertas de precio y actualizaciones.'
            : 'Your price alerts and updates will appear here.'}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.notifCard}>
              <View style={[styles.iconCircle, { backgroundColor: typeColor(item.type) + '20' }]}>
                <Text style={[styles.iconText, { color: typeColor(item.type) }]}>
                  {typeIcon(item.type)}
                </Text>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>
                  {isSpanish ? item.title_es : item.title_en}
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>
                  {isSpanish ? item.body_es : item.body_en}
                </Text>
                <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
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
  notifCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  notifBody: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: '#555',
    marginTop: 6,
  },
});
