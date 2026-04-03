import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  currentPrice: number;
  previousPrice: number | null;
  unit: string; // "lb", "kg", etc.
}

export default function PriceTrend({ currentPrice, previousPrice, unit }: Props) {
  let arrow = '';
  let arrowColor = '#888';

  if (previousPrice !== null) {
    if (currentPrice < previousPrice) {
      arrow = '\u2193'; // down arrow — price dropped
      arrowColor = '#4ecca3';
    } else if (currentPrice > previousPrice) {
      arrow = '\u2191'; // up arrow — price went up
      arrowColor = '#e94560';
    } else {
      arrow = '\u2192'; // right arrow — no change
      arrowColor = '#888';
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.price}>${currentPrice.toFixed(2)}</Text>
      <Text style={styles.unit}>/{unit}</Text>
      {arrow !== '' && (
        <Text style={[styles.arrow, { color: arrowColor }]}> {arrow}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  unit: {
    fontSize: 14,
    color: '#888',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },
});
