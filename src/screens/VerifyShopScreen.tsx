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
  shopId: string;
  shopName: string;
  shopAddress: string;
  onComplete: () => void;
}

type Step = 'phone' | 'otp' | 'address' | 'submitted';

export default function VerifyShopScreen({ shopId, shopName, shopAddress, onComplete }: Props) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  async function handleSubmitPhone() {
    if (phone.length < 10) {
      Alert.alert(isSpanish
        ? 'Ingresa un número válido de 10 dígitos'
        : 'Enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('request_shop_claim', {
      p_shop_id: shopId,
      p_phone: phone,
    });

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }

    setRequestId(data);

    // Send OTP via Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: `+1${phone}`,
    });

    if (otpError) {
      Alert.alert(otpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('otp');
  }

  async function handleVerifyOtp() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: `+1${phone}`,
      token: otp,
      type: 'sms',
    });

    if (error) {
      Alert.alert(isSpanish ? 'Código incorrecto' : 'Incorrect code');
      setLoading(false);
      return;
    }

    // Mark OTP as verified
    if (requestId) {
      await supabase
        .from('verification_requests')
        .update({ otp_verified: true })
        .eq('id', requestId);
    }

    setLoading(false);
    setStep('address');
  }

  async function handleConfirmAddress() {
    setLoading(true);
    if (requestId) {
      await supabase
        .from('verification_requests')
        .update({ address_confirmed: true })
        .eq('id', requestId);
    }
    setLoading(false);
    setStep('submitted');
  }

  if (step === 'submitted') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>OK</Text>
          <Text style={styles.title}>
            {isSpanish
              ? 'Solicitud enviada'
              : 'Claim submitted'}
          </Text>
          <Text style={styles.body}>
            {isSpanish
              ? 'Revisaremos tu solicitud en 24-48 horas. Te notificaremos cuando sea aprobada.'
              : 'We\'ll review your claim within 24-48 hours. You\'ll be notified when approved.'}
          </Text>
          <Pressable style={styles.button} onPress={onComplete}>
            <Text style={styles.buttonText}>
              {isSpanish ? 'Volver' : 'Go back'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSpanish ? 'Reclamar tu tienda' : 'Claim your shop'}
      </Text>
      <Text style={styles.shopInfo}>{shopName}</Text>
      <Text style={styles.shopAddr}>{shopAddress}</Text>

      {/* Step indicator */}
      <View style={styles.steps}>
        <View style={[styles.stepDot, step === 'phone' && styles.stepActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'otp' && styles.stepActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'address' && styles.stepActive]} />
      </View>

      {step === 'phone' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>
            {isSpanish ? 'Paso 1: Verifica tu teléfono' : 'Step 1: Verify your phone'}
          </Text>
          <Text style={styles.stepBody}>
            {isSpanish
              ? 'Ingresa el número de teléfono del negocio. Te enviaremos un código.'
              : 'Enter the business phone number. We\'ll send a verification code.'}
          </Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phonePrefix}>+1</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="(209) 555-0000"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmitPhone}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.buttonText}>
                {isSpanish ? 'Enviar código' : 'Send code'}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {step === 'otp' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>
            {isSpanish ? 'Paso 2: Ingresa el código' : 'Step 2: Enter the code'}
          </Text>
          <Text style={styles.stepBody}>
            {isSpanish
              ? `Enviamos un código al +1${phone}`
              : `We sent a code to +1${phone}`}
          </Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#666"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.buttonText}>
                {isSpanish ? 'Verificar' : 'Verify'}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {step === 'address' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>
            {isSpanish ? 'Paso 3: Confirma la dirección' : 'Step 3: Confirm address'}
          </Text>
          <Text style={styles.stepBody}>
            {isSpanish
              ? '¿Esta es la dirección correcta de tu negocio?'
              : 'Is this the correct address for your business?'}
          </Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>{shopName}</Text>
            <Text style={styles.addressText}>{shopAddress}</Text>
          </View>
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleConfirmAddress}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.buttonText}>
                {isSpanish ? 'Sí, esta es mi tienda' : 'Yes, this is my shop'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4ecca3',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  shopInfo: {
    fontSize: 16,
    color: '#e94560',
    fontWeight: '600',
  },
  shopAddr: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  stepActive: {
    backgroundColor: '#e94560',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#333',
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stepBody: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phonePrefix: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    letterSpacing: 1,
  },
  otpInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    letterSpacing: 8,
  },
  addressCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  addressText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
});
