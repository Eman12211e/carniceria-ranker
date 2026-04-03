import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  priceScore: number | null;
  qualityScore: number | null;
  consistencyScore: number | null;
}

function fillWidth(score: number | null): string {
  if (score === null) return '0%';
  return `${Math.min(100, (score / 5) * 100)}%`;
}

function barColor(score: number | null): string {
  if (score === null) return '#333';
  if (score >= 4) return '#4ecca3';
  if (score >= 2.5) return '#f0c040';
  return '#e94560';
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: fillWidth(score), backgroundColor: barColor(score) },
          ]}
        />
      </View>
      <Text style={[styles.barValue, { color: barColor(score) }]}>
        {score !== null ? score.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

export default function ScoreBadgeBar({ priceScore, qualityScore, consistencyScore }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScoreBar label={t('score.price')} score={priceScore} />
      <ScoreBar label={t('score.quality')} score={qualityScore} />
      <ScoreBar label={t('score.consistency')} score={consistencyScore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    width: 85,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
});
