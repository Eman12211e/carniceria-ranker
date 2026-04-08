import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface Props {
  icon?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({ icon, title, body, ctaLabel, onCtaPress }: Props) {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onCtaPress && (
        <Pressable style={styles.cta} onPress={onCtaPress}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: '#e94560',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
