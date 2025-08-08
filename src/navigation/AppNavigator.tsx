// src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
// import OtherScreen from '../screens/OtherScreen'; // Example

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true, // enables slide back
        animation: 'slide_from_right', // iOS-like slide
        headerShown: false, // hide header if you want
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* <Stack.Screen name="Other" component={OtherScreen} /> */}
    </Stack.Navigator>
  );
}