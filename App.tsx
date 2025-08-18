import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

function InnerApp() {
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer>
      {/* Render a view under the status bar to control its background when edge-to-edge is enabled */}
      <View style={{ height: insets.top, backgroundColor: '#1a1a1a' }} />
      <StatusBar style="light" />
      <BottomTabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <InnerApp />
    </SafeAreaProvider>
  );
}
