import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const STEPS = [
  { titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body', icon: '🔍' },
  { titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body', icon: '📍' },
  { titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body', icon: '💰' },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <Pressable style={styles.skipButton} onPress={onComplete}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.icon}>{STEPS[step].icon}</Text>
        <Text style={styles.title}>{t(STEPS[step].titleKey)}</Text>
        <Text style={styles.body}>{t(STEPS[step].bodyKey)}</Text>
      </View>

      {/* Step indicators */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={() => (isLast ? onComplete() : setStep(step + 1))}
      >
        <Text style={styles.buttonText}>
          {isLast ? t('onboarding.getStarted') : 'Next'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 17,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#e94560',
    width: 24,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: width - 48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
