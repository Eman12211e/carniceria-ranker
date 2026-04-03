import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  priceScore: number | null;   // 0-5, lower = cheaper = better
  qualityScore: number | null; // 1-5, higher = better
  consistencyScore: number | null; // 0-5, higher = more stable
}

function scoreColor(score: number | null): string {
  if (score === null) return '#555';
  if (score >= 4) return '#4ecca3';
  if (score >= 2.5) return '#f0c040';
  return '#e94560';
}

function ScorePill({ label, score }: { label: string; score: number | null }) {
  return (
    <View style={[styles.pill, { borderColor: scoreColor(score) }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillScore, { color: scoreColor(score) }]}>
        {score !== null ? score.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

export default function ScoreBadge({ priceScore, qualityScore, consistencyScore }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScorePill label={t('score.price')} score={priceScore} />
      <ScorePill label={t('score.quality')} score={qualityScore} />
      <ScorePill label={t('score.consistency')} score={consistencyScore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  pillLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pillScore: {
    fontSize: 18,
    fontWeight: '700',
  },
});
