import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const CCPA_KEY = 'ccpa_acknowledged';

export default function CCPABanner() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(true);
  const isSpanish = i18n.language === 'es';

  async function handleAccept() {
    await AsyncStorage.setItem(CCPA_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {isSpanish
          ? 'Usamos datos de ubicación para encontrar tiendas cerca de ti. No vendemos tu información personal. Puedes solicitar la eliminación de tus datos en cualquier momento desde tu perfil.'
          : 'We use location data to find shops near you. We do not sell your personal information. You can request deletion of your data at any time from your profile.'}
      </Text>
      <View style={styles.buttons}>
        <Pressable style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptText}>
            {isSpanish ? 'Entendido' : 'Got it'}
          </Text>
        </Pressable>
        <Pressable style={styles.learnMore}>
          <Text style={styles.learnMoreText}>
            {isSpanish ? 'Más info' : 'Learn more'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  text: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#e94560',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  learnMore: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  learnMoreText: {
    color: '#888',
    fontSize: 14,
  },
});
