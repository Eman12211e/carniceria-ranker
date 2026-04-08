import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  function toggleLanguage() {
    i18n.changeLanguage(isSpanish ? 'en' : 'es');
  }

  async function handleExportData() {
    const { data, error } = await supabase.rpc('export_my_data');
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    Alert.alert(
      isSpanish ? 'Datos exportados' : 'Data exported',
      isSpanish
        ? 'Tus datos se han preparado. Revisa la consola para el JSON completo.'
        : 'Your data has been prepared. Check console for full JSON.'
    );
  }

  function handleDeleteData() {
    Alert.alert(
      isSpanish ? 'Eliminar mis datos' : 'Delete my data',
      isSpanish
        ? 'Esto eliminará permanentemente todas tus reseñas, fotos, precios enviados y datos personales. Esta acción no se puede deshacer.'
        : 'This will permanently delete all your reviews, photos, submitted prices, and personal data. This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isSpanish ? 'Eliminar todo' : 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('request_data_deletion');
            if (error) {
              Alert.alert(t('common.error'), error.message);
              return;
            }
            Alert.alert(
              isSpanish ? 'Datos eliminados' : 'Data deleted',
              isSpanish
                ? 'Todos tus datos personales han sido eliminados.'
                : 'All your personal data has been deleted.'
            );
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{t('nav.profile')}</Text>

      <Pressable style={styles.option} onPress={toggleLanguage}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Idioma' : 'Language'}
        </Text>
        <Text style={styles.optionValue}>
          {isSpanish ? 'Espanol' : 'English'}
        </Text>
      </Pressable>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>{t('auth.signIn')}</Text>
      </Pressable>

      {/* Butcher section */}
      <Text style={styles.sectionHeader}>
        {isSpanish ? 'Para duenos de tienda' : 'For shop owners'}
      </Text>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Reclamar una tienda' : 'Claim a shop'}
        </Text>
      </Pressable>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Subir precios' : 'Upload prices'}
        </Text>
      </Pressable>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Suscripción' : 'Subscription'}
        </Text>
        <Text style={styles.optionValue}>
          {isSpanish ? 'Administrar plan' : 'Manage plan'}
        </Text>
      </Pressable>

      <Pressable style={styles.option}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Reseñas y Respuestas' : 'Reviews & Responses'}
        </Text>
      </Pressable>

      {/* Privacy & Data */}
      <Text style={styles.sectionHeader}>
        {isSpanish ? 'Privacidad y datos' : 'Privacy & data'}
      </Text>

      <Pressable style={styles.option} onPress={handleExportData}>
        <Text style={styles.optionLabel}>
          {isSpanish ? 'Exportar mis datos' : 'Export my data'}
        </Text>
        <Text style={styles.optionHint}>CCPA</Text>
      </Pressable>

      <Pressable style={[styles.option, styles.dangerOption]} onPress={handleDeleteData}>
        <Text style={[styles.optionLabel, styles.dangerText]}>
          {isSpanish ? 'Eliminar mis datos' : 'Delete my data'}
        </Text>
      </Pressable>

      <Text style={styles.ccpaNote}>
        {isSpanish
          ? 'Bajo la Ley de Privacidad del Consumidor de California (CCPA), tienes derecho a solicitar la exportacion o eliminacion de tus datos personales en cualquier momento.'
          : 'Under the California Consumer Privacy Act (CCPA), you have the right to request export or deletion of your personal data at any time.'}
      </Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 1,
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
  optionHint: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  dangerOption: {
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  dangerText: {
    color: '#e94560',
  },
  ccpaNote: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
