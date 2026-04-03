import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import SearchScreen from '@/screens/SearchScreen';
import MapScreen from '@/screens/MapScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: t('nav.search') }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: t('nav.map') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}
