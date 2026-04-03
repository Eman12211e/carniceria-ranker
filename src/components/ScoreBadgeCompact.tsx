import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  priceScore: number | null;
  qualityScore: number | null;
  consistencyScore: number | null;
}

function overallScore(p: number | null, q: number | null, c: number | null): number | null {
  const scores = [p, q, c].filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function scoreColor(score: number | null): string {
  if (score === null) return '#555';
  if (score >= 4) return '#4ecca3';
  if (score >= 2.5) return '#f0c040';
  return '#e94560';
}

function scoreEmoji(score: number | null): string {
  if (score === null) return '';
  if (score >= 4) return 'A';
  if (score >= 3) return 'B';
  if (score >= 2) return 'C';
  return 'D';
}

export default function ScoreBadgeCompact({ priceScore, qualityScore, consistencyScore }: Props) {
  const { t } = useTranslation();
  const overall = overallScore(priceScore, qualityScore, consistencyScore);
  const grade = scoreEmoji(overall);
  const color = scoreColor(overall);

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.grade, { color }]}>{grade || '—'}</Text>
      <View style={styles.breakdown}>
        <Text style={styles.miniLabel}>
          {t('score.price').charAt(0)}: {priceScore?.toFixed(1) ?? '—'}
        </Text>
        <Text style={styles.miniLabel}>
          {t('score.quality').charAt(0)}: {qualityScore?.toFixed(1) ?? '—'}
        </Text>
        <Text style={styles.miniLabel}>
          {t('score.consistency').charAt(0)}: {consistencyScore?.toFixed(1) ?? '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    alignSelf: 'flex-start',
  },
  grade: {
    fontSize: 28,
    fontWeight: '900',
  },
  breakdown: {
    gap: 1,
  },
  miniLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
});
