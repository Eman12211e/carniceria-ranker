import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('nav.profile')}</Text>

      <Pressable style={styles.option} onPress={toggleLanguage}>
        <Text style={styles.optionLabel}>
          {i18n.language === 'es' ? 'Idioma' : 'Language'}
        </Text>
        <Text style={styles.optionValue}>
          {i18n.language === 'es' ? 'Español' : 'English'}
        </Text>
      </Pressable>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>{t('auth.signIn')}</Text>
      </Pressable>
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
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  option: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
  },
  optionValue: {
    fontSize: 16,
    color: '#e94560',
  },
});
