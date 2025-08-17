
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import groqService from '../services/groqService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
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
  searchSection: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 16,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  stopButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 20,
  },
  stopButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(36,36,36,0.85)',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});


// Duplicate imports removed
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState<{ answer: string; references?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readingSource, setReadingSource] = useState<'remote' | 'cache' | null>(null);
  

  useEffect(() => {
    const fetchReading = async () => {
      setLoading(true);
      setError(null);
      setReadingSource(null);
  const cacheKey = `dailyReading`;
      // Try to load cached reading first (non-blocking UI)
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.answer) {
            setReading(parsed);
            setReadingSource('cache');
          }
        }
      } catch (e) {
        // ignore cache errors
      }
      try {
  const result = await groqService.getDailyReading();
        // If backend indicates an error, surface a friendly message and keep fallback verses
        if (result.error) {
          setError(result.answer || result.error || 'Server returned an error.');
          // try to keep cached reading (already set above) and mark source
          if (!reading) {
            // no cached reading present
            setReading(null);
            setReadingSource(null);
          }
        } else {
          setReading(result);
          setReadingSource('remote');
          // persist successful reading to cache
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            // ignore cache write errors
          }
        }
      } catch (err) {
        setError('Failed to get daily reading.');
      } finally {
        setLoading(false);
      }
    };
    fetchReading();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#181a1b", "#232627"]}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, minHeight: 56, justifyContent: 'center' }]}> 
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Bible Reading</Text>
        </View>
  {/* Language picker removed - using default server language */}
        {/* Bible Reading Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#6366f1', fontSize: 16 }}>Loading...</Text>
            </View>
          )}
          {error && !reading && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: '#2b2f31', borderRadius: 12, padding: 14, width: '100%' }}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>{error}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setError(null);
                setLoading(true);
                const cacheKey = `dailyReading`;
                groqService.getDailyReading().then(async (r) => {
                  if (r.error) {
                    setError(r.answer || r.error || 'Server returned an error.');
                    setReading(null);
                    setReadingSource(null);
                  } else {
                    setReading(r);
                    setReadingSource('remote');
                    try { await AsyncStorage.setItem(cacheKey, JSON.stringify(r)); } catch {}
                  }
                }).catch(() => setError('Failed to get daily reading.')).finally(() => setLoading(false));
              }} style={{ marginTop: 8 }}>
                <Text style={{ color: '#6366f1' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {reading && reading.answer ? (
            <View style={styles.resultItem}>
              {readingSource === 'cache' && (
                <Text style={{ color: '#bfc3c9', marginBottom: 8 }}>Showing cached reading</Text>
              )}
              <Text style={styles.verseText}>{reading.answer}</Text>
              {reading.references && reading.references.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#6366f1', fontWeight: '600', marginBottom: 4 }}>References:</Text>
                  {reading.references.map((ref, idx) => (
                    <Text key={idx} style={{ color: '#e5e7eb', fontSize: 15 }}>{ref}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            // Fallback static verses when no reading available
            <View style={styles.resultItem}>
              <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Today's reading is unavailable — showing a short excerpt:</Text>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#6366f1', fontWeight: '600' }}>Genesis 1:1-5</Text>
                <Text style={styles.verseText}>1. In the beginning God created the heavens and the earth.</Text>
                <Text style={styles.verseText}>2. Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.</Text>
                <Text style={styles.verseText}>3. And God said, "Let there be light," and there was light.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );

}


