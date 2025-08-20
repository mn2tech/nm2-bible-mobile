import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ReadingScreen from '../screens/ReadingScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
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
            iconName = focused ? 'locate' : 'locate-outline';
          } else if (route.name === 'Search' || route.name === 'BiblicalNews') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'DailyDevotional' || route.name === 'Favorites') {
            // Favorites tab repurposed as Daily Devotional — show a book icon
            iconName = focused ? 'book' : 'book-outline';
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
      {/* Renamed Search tab to BiblicalNews (still uses SearchScreen component) */}
      <Tab.Screen
        name="BiblicalNews"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Biblical News',
          tabBarShowLabel: true,
          tabBarAccessibilityLabel: 'Biblical News Tab',
        }}
      />
  <Tab.Screen name="Pray" component={ReadingScreen} options={{ tabBarLabel: 'Pray' }} />
  <Tab.Screen name="DailyDevotional" component={FavoritesScreen} options={{ tabBarLabel: 'Devotional', tabBarAccessibilityLabel: 'Devotional Tab' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
