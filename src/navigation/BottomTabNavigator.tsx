import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ReadingScreen from '../screens/ReadingScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          // Use a prayer-hands icon for the Pray tab via FontAwesome5.
          if (route.name === 'Pray' || route.name === 'Reading') {
            // alternate FA5 name: try 'praying-hands' if 'hands-praying' isn't available in this pack
            return <FontAwesome5 name="praying-hands" size={24} color={color} solid={focused} />;
          }

          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          height: 60 + insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
          color: '#e5e7eb',
        },
      })}
    >
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Pray" component={ReadingScreen} options={{ tabBarLabel: 'Pray' }} />
  <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Favorites', tabBarAccessibilityLabel: 'Favorites Tab' }} />
  <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History', tabBarAccessibilityLabel: 'History Tab' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
