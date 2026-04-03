import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import '@/i18n';
import OnboardingScreen from '@/screens/OnboardingScreen';
import TabNavigator from '@/navigation/TabNavigator';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      {onboarded ? (
        <TabNavigator />
      ) : (
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      )}
    </NavigationContainer>
  );
}
