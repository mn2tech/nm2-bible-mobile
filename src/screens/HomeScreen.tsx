import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isVerySmallScreen = height < 650;

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  
  // Calculate available space
  const tabBarHeight = 50 + insets.bottom;
  const headerHeight = 44 + insets.top;
  const availableHeight = height - tabBarHeight - headerHeight;
  const isCompactMode = availableHeight < 500;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Here you can add your search logic
      console.log('Searching for:', searchQuery);
      // For now, just clear the input
      setSearchQuery('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={['#1a1a1a', '#0f1419']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>NM2BibleAI</Text>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={[styles.mainContent, { height: availableHeight - 140 }]}>
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <Ionicons 
                name="book" 
                size={isCompactMode ? 35 : isVerySmallScreen ? 40 : isSmallScreen ? 45 : 50} 
                color="#6366f1" 
              />
            </View>

            {/* Tagline */}
            <View style={styles.taglineContainer}>
              <Text style={[styles.taglineText, { 
                fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28 
              }]}>Where</Text>
              <Text style={[styles.taglineText, { 
                fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28 
              }]}>wisdom</Text>
              <Text style={[styles.taglineText, { 
                fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28 
              }]}>begins</Text>
            </View>
          </View>

          {/* Search Section */}
          <View style={[styles.searchSection, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.searchContainer}>
              <Ionicons name="camera-outline" size={24} color="#ffffff" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ask anything about bible..."
                placeholderTextColor="#888888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor="#6366f1"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity 
                style={[styles.micButton, searchQuery.trim() ? styles.sendButton : null]} 
                onPress={searchQuery.trim() ? handleSearch : undefined}
              >
                <Ionicons 
                  name={searchQuery.trim() ? "send" : "mic-outline"} 
                  size={24} 
                  color={searchQuery.trim() ? "#6366f1" : "#ffffff"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 44,
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  taglineContainer: {
    alignItems: 'center',
  },
  taglineText: {
    fontWeight: '300',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 3,
  },
  searchSection: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 18,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '400',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    textAlign: 'left',
  },
  micButton: {
    marginLeft: 16,
    padding: 4,
  },
  sendButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
});
