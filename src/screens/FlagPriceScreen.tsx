import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface Props {
  priceId: string;
  shopName: string;
  cutName: string;
  currentPrice: number;
  unit: string;
  onComplete: () => void;
}

const FLAG_REASONS_EN = [
  'Price is higher than listed',
  'Price is lower than listed',
  'This cut is no longer available',
  'Shop is closed or no longer exists',
  'Other',
];

const FLAG_REASONS_ES = [
  'El precio es más alto de lo que dice',
  'El precio es más bajo de lo que dice',
  'Este corte ya no está disponible',
  'La tienda está cerrada o ya no existe',
  'Otro',
];

export default function FlagPriceScreen({
  priceId, shopName, cutName, currentPrice, unit, onComplete,
}: Props) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const reasons = isSpanish ? FLAG_REASONS_ES : FLAG_REASONS_EN;

  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (selectedReason === null) return;

    const reason = selectedReason === reasons.length - 1 && customReason
      ? customReason
      : reasons[selectedReason];

    setSubmitting(true);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      Alert.alert(isSpanish ? 'Inicia sesión para reportar' : 'Sign in to report');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('price_flags').insert({
      price_id: priceId,
      flagged_by: user.id,
      reason,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert(isSpanish ? 'Ya reportaste este precio' : 'You already flagged this price');
      } else {
        Alert.alert(error.message);
      }
    } else {
      Alert.alert(
        isSpanish ? 'Gracias' : 'Thank you',
        isSpanish
          ? 'Tu reporte nos ayuda a mantener los precios precisos.'
          : 'Your report helps us keep prices accurate.'
      );
      onComplete();
    }
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSpanish ? 'Reportar precio incorrecto' : 'Report inaccurate price'}
      </Text>

      <View style={styles.priceCard}>
        <Text style={styles.shopName}>{shopName}</Text>
        <Text style={styles.cutName}>{cutName}</Text>
        <Text style={styles.price}>${currentPrice.toFixed(2)}/{unit}</Text>
      </View>

      <Text style={styles.label}>
        {isSpanish ? '¿Qué está mal?' : 'What\'s wrong?'}
      </Text>

      {reasons.map((reason, idx) => (
        <Pressable
          key={idx}
          style={[styles.reasonOption, selectedReason === idx && styles.reasonSelected]}
          onPress={() => setSelectedReason(idx)}
        >
          <View style={[styles.radio, selectedReason === idx && styles.radioActive]} />
          <Text style={[styles.reasonText, selectedReason === idx && styles.reasonTextActive]}>
            {reason}
          </Text>
        </Pressable>
      ))}

      {selectedReason === reasons.length - 1 && (
        <TextInput
          style={styles.customInput}
          placeholder={isSpanish ? 'Describe el problema...' : 'Describe the issue...'}
          placeholderTextColor="#666"
          value={customReason}
          onChangeText={setCustomReason}
          multiline
          maxLength={500}
        />
      )}

      <Pressable
        style={[styles.submitButton, (selectedReason === null || submitting) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={selectedReason === null || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {isSpanish ? 'Enviar reporte' : 'Submit report'}
          </Text>
        )}
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  priceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  shopName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cutName: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  price: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
  },
  reasonSelected: {
    borderWidth: 1,
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#555',
  },
  radioActive: {
    borderColor: '#e94560',
    backgroundColor: '#e94560',
  },
  reasonText: {
    color: '#aaa',
    fontSize: 15,
  },
  reasonTextActive: {
    color: '#fff',
  },
  customInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: {
    backgroundColor: '#555',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
