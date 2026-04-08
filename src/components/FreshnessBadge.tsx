import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  status: 'fresh' | 'aging' | 'stale' | 'no_data';
  daysSinceUpdate: number;
}

const STATUS_CONFIG = {
  fresh: { color: '#4ecca3', bg: 'rgba(78, 204, 163, 0.12)' },
  aging: { color: '#f0c040', bg: 'rgba(240, 192, 64, 0.12)' },
  stale: { color: '#e94560', bg: 'rgba(233, 69, 96, 0.12)' },
  no_data: { color: '#555', bg: 'rgba(85, 85, 85, 0.12)' },
};

export default function FreshnessBadge({ status, daysSinceUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const config = STATUS_CONFIG[status];
  const isSpanish = i18n.language === 'es';

  let label: string;
  if (status === 'no_data') {
    label = isSpanish ? 'Sin datos' : 'No data';
  } else if (status === 'fresh') {
    label = isSpanish ? 'Actualizado' : 'Updated';
  } else if (status === 'aging') {
    label = isSpanish
      ? `Hace ${daysSinceUpdate} días`
      : `${daysSinceUpdate}d ago`;
  } else {
    label = isSpanish ? 'Precios pueden estar desactualizados' : 'Prices may be outdated';
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
