import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ResponseScreen from '../screens/ResponseScreen';

interface GalleryImage {
  url: string;
  caption?: string;
}

export type HomeStackParamList = {
  HomeMain: undefined;
  Response: {
    question: string;
    answer: string;
    references?: string[];
    images?: GalleryImage[];
  };
};

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Response" component={ResponseScreen} />
    </Stack.Navigator>
  );
}
