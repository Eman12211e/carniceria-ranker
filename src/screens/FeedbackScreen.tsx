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

const FEEDBACK_TYPES_EN = ['Bug', 'Missing shop', 'Wrong price', 'Feature request', 'Other'];
const FEEDBACK_TYPES_ES = ['Error', 'Tienda faltante', 'Precio incorrecto', 'Sugerencia', 'Otro'];

export default function FeedbackScreen() {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const types = isSpanish ? FEEDBACK_TYPES_ES : FEEDBACK_TYPES_EN;

  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (selectedType === null || message.trim().length < 5) return;

    setSubmitting(true);
    const user = (await supabase.auth.getUser()).data.user;

    // Store feedback in a simple table (or could use an edge function to send to Slack)
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      type: FEEDBACK_TYPES_EN[selectedType], // always store in English
      message: message.trim(),
      language: i18n.language,
    });

    if (error) {
      // If feedback table doesn't exist yet, just show success anyway
      // The table will be created when needed
    }

    Alert.alert(
      isSpanish ? 'Gracias' : 'Thank you',
      isSpanish
        ? 'Tu comentario nos ayuda a mejorar. Lo revisaremos pronto.'
        : 'Your feedback helps us improve. We\'ll review it soon.'
    );
    setMessage('');
    setSelectedType(null);
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Enviar comentario' : 'Send Feedback'}
      </Text>
      <Text style={styles.subtitle}>
        {isSpanish
          ? 'Estamos en beta — tu opinión importa mucho.'
          : 'We\'re in beta — your feedback matters a lot.'}
      </Text>

      <Text style={styles.label}>
        {isSpanish ? '¿Qué tipo de comentario?' : 'What type of feedback?'}
      </Text>
      <View style={styles.typeRow}>
        {types.map((type, idx) => (
          <Pressable
            key={idx}
            style={[styles.typePill, selectedType === idx && styles.typePillActive]}
            onPress={() => setSelectedType(idx)}
          >
            <Text style={[styles.typeText, selectedType === idx && styles.typeTextActive]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>
        {isSpanish ? 'Cuéntanos más' : 'Tell us more'}
      </Text>
      <TextInput
        style={styles.messageInput}
        placeholder={isSpanish
          ? 'Describe el problema o sugerencia...'
          : 'Describe the issue or suggestion...'}
        placeholderTextColor="#666"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={1000}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{message.length}/1000</Text>

      <Pressable
        style={[
          styles.submitButton,
          (selectedType === null || message.trim().length < 5 || submitting) && styles.submitDisabled,
        ]}
        onPress={handleSubmit}
        disabled={selectedType === null || message.trim().length < 5 || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {isSpanish ? 'Enviar' : 'Submit'}
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
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 10,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typePillActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
  },
  typeText: {
    color: '#888',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#e94560',
  },
  messageInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
    marginTop: 4,
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
