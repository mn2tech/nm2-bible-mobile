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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GroqBibleService from '../services/groqService';


function HomeScreen() {
  interface BibleResponse {
    answer: string;
    references?: string[];
  }

  const { width, height } = Dimensions.get('window');
  const isSmallScreen = height < 700;
  const isVerySmallScreen = height < 650;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [response, setResponse] = useState<BibleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + insets.bottom;
  const headerHeight = 44 + insets.top;
  const availableHeight = height - tabBarHeight - headerHeight;
  const isCompactMode = availableHeight < 500;

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setLoading(true);
      setError(null);
      setResponse(null);
      try {
        const result = await GroqBibleService.queryBible(searchQuery.trim());
        setResponse(result);
      } catch (err) {
        setError('Failed to get response.');
      } finally {
        setLoading(false);
      }
      setSearchQuery('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, flex: 1 }]}> 
      {/* Jesus cross background - hide when response is shown */}
      {!(response && response.answer) && (
        <View pointerEvents="none" style={styles.crossContainer}>
          {/* Vertical line (center) */}
          <View style={styles.crossVertical} />
          {/* Horizontal line (center) */}
          <View style={styles.crossHorizontal} />
        </View>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { flex: 1 }]}
      >
        <LinearGradient
          colors={['#1a1a1a', '#0f1419']}
          style={[styles.gradient, { flex: 1 }]}
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
          {/* Main Content: logo/tagline only if no response */}
          {!(response && response.answer) && (
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
          )}
          {/* Search Section and Response Feed */}
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {loading && (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#6366f1', fontSize: 16 }}>Thinking...</Text>
                </View>
              )}
              {error && (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#ef4444', fontSize: 16 }}>{error}</Text>
                </View>
              )}
              {response && response.answer && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#ffffff', fontSize: 17, marginBottom: 8 }}>{response.answer}</Text>
                  {response.references && response.references.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: '#6366f1', fontWeight: '600', marginBottom: 4 }}>References:</Text>
                      {response.references.map((ref: string, idx: number) => (
                        <Text key={idx} style={{ color: '#e5e7eb', fontSize: 15 }}>{ref}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            {/* Search input always visible at the bottom */}
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
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  crossContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossVertical: {
    position: 'absolute',
    top: '22%', // Move up a little
    bottom: '36%', // Move up a little
    left: '50%',
    width: 6,
    marginLeft: -3,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  crossHorizontal: {
    position: 'absolute',
    left: '32%', // Make horizontal line shorter
    right: '32%',
    top: '32%', // Move horizontal line up
    height: 6,
    marginTop: -3,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
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
    marginLeft: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
});
