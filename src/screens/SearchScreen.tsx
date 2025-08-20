
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import newsService from '../services/newsService';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
// import Video dynamically with safe fallback to expo-av
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
// small helper to format dates with full month name (e.g., April 12, 2025)
const formatDate = (raw?: string) => {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return raw;
  }
};

// ...existing code...

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
  heroCard: {
    backgroundColor: '#2b2f31',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 160,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  heroMeta: {
    color: '#cbd5e1',
    marginTop: 6,
    fontSize: 12
  },
  heroContent: {
    padding: 14,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#374151',
  },
  // list item row layout
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 96,
    height: 72,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#374151'
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  itemSummary: {
    color: '#d1d5db',
    marginTop: 6,
    fontSize: 14,
  },
  sourceBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  readMore: {
    color: '#93c5fd',
    marginTop: 8,
    fontWeight: '600'
  },
  playOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
  // Dev toggle: when true, clear saved biblical news and feed URL on mount.
  // Set to true to force-clear the news page during development.
  const CLEAR_BIBLE_NEWS_ON_MOUNT = true;
  // News state
  const [news, setNews] = useState<Array<{ id: string; title: string; summary: string; source?: string; publishedAt?: string; image?: string; video?: string; url?: string }>>([]);
  const navigation = useNavigation<any>();
  // feed URL input removed; the app will auto-discover curated feeds or use backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedEditorVisible, setFeedEditorVisible] = useState(false);
  const [feedUrlInput, setFeedUrlInput] = useState<string>('');
  

  useEffect(() => {
    // On mount, load saved feed URL and cached news
    const init = async () => {
      if (CLEAR_BIBLE_NEWS_ON_MOUNT) {
        try {
          await AsyncStorage.removeItem('biblicalNews');
          await AsyncStorage.removeItem('newsFeedUrl');
        } catch (e) {
          // ignore
        }
      }
      setLoading(true);
      try {
  const saved = await AsyncStorage.getItem('newsFeedUrl');
  if (saved) setFeedUrlInput(saved);
  // saved feed URL will be used automatically when discovered, no UI to edit here

        const cacheKey = 'biblicalNews';
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) setNews(JSON.parse(cached));

        // If we have a saved feed, try loading it; otherwise try a set of curated feeds and fall back to the backend API
  let items: Array<{ id: string; title: string; summary: string; source?: string; publishedAt?: string; image?: string; video?: string; url?: string }> = [];
        if (saved) {
          items = await newsService.getBibleNews(saved);
        } else {
          const candidates = [
            'https://harbingersdaily.com/feed/',
            'https://www.thegospelcoalition.org/feed/',
            'https://www.christianitytoday.com/rss.xml',
            'https://www.christianpost.com/rss.xml',
          ];
          let found = null;
          for (const c of candidates) {
            try {
              const candidateItems = await newsService.getBibleNews(c);
              if (candidateItems && candidateItems.length > 0) {
                found = candidateItems;
                // persist the working feed URL
                try { await AsyncStorage.setItem('newsFeedUrl', c); } catch {}
                break;
              }
            } catch (e) {
              // try next candidate
              continue;
            }
          }
          if (found) items = found; else { items = []; setError('No RSS feed discovered.'); }
        }
  setNews(items);
  try { await AsyncStorage.setItem('biblicalNews', JSON.stringify(items)); } catch {}
      } catch (e) {
        setError('Failed to load news.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

    const openFeedEditor = async () => {
      const saved = await AsyncStorage.getItem('newsFeedUrl');
      setFeedUrlInput(saved || '');
      setFeedEditorVisible(true);
    };

    const saveFeedUrl = async () => {
      try {
        if (feedUrlInput && feedUrlInput.trim()) {
          await AsyncStorage.setItem('newsFeedUrl', feedUrlInput.trim());
          setFeedEditorVisible(false);
          // reload with provided url
          await loadFeed(feedUrlInput.trim());
        }
      } catch (e) {
        // ignore and close
        setFeedEditorVisible(false);
      }
    };

  const loadFeed = async (url?: string) => {
    setLoading(true);
    setError(null);
    try {
  let items: Array<{ id: string; title: string; summary: string; source?: string; publishedAt?: string; image?: string; video?: string; url?: string }> = [];
      if (url) {
        try { await AsyncStorage.setItem('newsFeedUrl', url); } catch {}
        items = await newsService.getBibleNews(url);
      } else {
        // try curated candidates automatically
        const candidates = [
          'https://harbingersdaily.com/feed/',
          'https://www.thegospelcoalition.org/feed/',
          'https://www.christianitytoday.com/rss.xml',
          'https://www.christianpost.com/rss.xml',
        ];
        let found = null;
        for (const c of candidates) {
          try {
            const candidateItems = await newsService.getBibleNews(c);
            if (candidateItems && candidateItems.length > 0) { found = candidateItems; try { await AsyncStorage.setItem('newsFeedUrl', c); } catch {} ; break; }
          } catch (e) { continue; }
        }
  if (found) items = found; else { items = []; setError('No RSS feed discovered.'); }
      }
  setNews(items);
  try { await AsyncStorage.setItem('biblicalNews', JSON.stringify(items)); } catch {}
    } catch (e) {
      setError('Failed to load feed.');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    setError(null);
    try {
      await AsyncStorage.removeItem('biblicalNews');
      await AsyncStorage.removeItem('newsFeedUrl');
      setNews([]);
      // reload (will try curated feeds and API fallback)
      await loadFeed();
    } catch (e) {
      setError('Failed to clear cache.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#181a1b", "#232627"]}
        style={{ flex: 1 }}
      >
        {/* Header */}
  <View style={[styles.header, { paddingTop: insets.top, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Biblical News & Analysis</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openFeedEditor} style={{ marginRight: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0b1220', borderRadius: 8, borderWidth: 1, borderColor: '#23272f' }} accessibilityLabel="Edit feed URL">
              <Ionicons name="link-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setError(null); loadFeed(); }} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#111827', borderRadius: 8, borderWidth: 1, borderColor: '#2b2f31' }} accessibilityLabel="Refresh Biblical News">
              {loading ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={{ color: '#6366f1', fontSize: 14 }}>Refresh</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={clearCache} style={{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#2a0b0b', borderRadius: 8, borderWidth: 1, borderColor: '#3b0f0f' }} accessibilityLabel="Clear news cache and reload">
              <Text style={{ color: '#fda4af', fontSize: 12 }}>Clear cache</Text>
            </TouchableOpacity>
          </View>
        </View>
  {/* Feed selection removed — curated feeds are auto-discovered */}
        {/* Biblical News Content */}
        {feedEditorVisible && (
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <View style={{ backgroundColor: '#111827', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#23272f' }}>
              <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Feed URL or homepage (paste a page like livinghisword or harbingers):</Text>
              <TextInput
                value={feedUrlInput}
                onChangeText={setFeedUrlInput}
                placeholder="https://example.com/feed/"
                placeholderTextColor="#6b7280"
                style={{ color: '#fff', borderWidth: 1, borderColor: '#2b2f31', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <TouchableOpacity onPress={() => setFeedEditorVisible(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: '#9ca3af' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { if (feedUrlInput && feedUrlInput.trim()) { await saveFeedUrl(); } }} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#063b5b', borderRadius: 8 }}>
                  <Text style={{ color: '#fff' }}>Save & Load</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { if (feedUrlInput && feedUrlInput.trim()) { setError(null); setLoading(true); try { const items = await newsService.getBibleNews(feedUrlInput.trim()); setNews(items); try { await AsyncStorage.setItem('biblicalNews', JSON.stringify(items)); } catch {} } catch (e) { setError('Failed to load feed.'); } finally { setLoading(false); } } }} style={{ paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 }}>
                  <Text style={{ color: '#9ca3af' }}>Try</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#6366f1', fontSize: 16 }}>Loading...</Text>
            </View>
          )}
          {error && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: '#2b2f31', borderRadius: 12, padding: 14, width: '100%' }}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>{error}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                // simple retry: reload news
                setError(null);
                setLoading(true);
                (async () => {
                  try {
                    const mocked = [
                      { id: '1', title: 'Church opens new community garden', summary: 'Local church launches a community garden to support families in need.', source: 'Local', publishedAt: '2025-08-12' },
                      { id: '2', title: 'Bible translation project completes milestone', summary: 'A grassroots translation project finishes the New Testament draft for a language group.', source: 'Mission News', publishedAt: '2025-08-10' },
                      { id: '3', title: 'Conference on modern parables draws hundreds', summary: 'Ministers and teachers gather to explore how parables shape modern preaching.', source: 'FaithDaily', publishedAt: '2025-08-08' },
                    ];
                    await new Promise(r => setTimeout(r, 300));
                    setNews(mocked);
                    try { await AsyncStorage.setItem('biblicalNews', JSON.stringify(mocked)); } catch {}
                  } catch (e) {
                    setError('Failed to load news.');
                  } finally {
                    setLoading(false);
                  }
                })();
              }} style={{ marginTop: 8 }}>
                <Text style={{ color: '#6366f1' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#6366f1', fontSize: 16 }}>Loading news...</Text>
            </View>
          )}
          {error && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: '#2b2f31', borderRadius: 12, padding: 14, width: '100%' }}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>{error}</Text>
              </View>
            </View>
          )}

          {news.length > 0 && (
            <View style={{ marginTop: 6 }}>
              {/* Hero card for the first item */}
              <TouchableOpacity
                style={styles.heroCard}
                onPress={async () => { if (news[0].url) await WebBrowser.openBrowserAsync(news[0].url); }}
                activeOpacity={0.95}
              >
                {news[0].image ? <Image source={{ uri: news[0].image }} style={styles.heroImage} resizeMode="cover" /> : <View style={[styles.heroImage, { backgroundColor: '#111827' }]} />}
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroMeta}>{news[0].source} • {formatDate(news[0].publishedAt)}</Text>
                  <Text style={styles.heroTitle} numberOfLines={2}>{news[0].title}</Text>
                  <Text style={{ color: '#e5e7eb', marginTop: 8 }} numberOfLines={3}>{news[0].summary}</Text>
                </View>
              </TouchableOpacity>

              {/* Thumbnails for the remaining items */}
              {news.slice(1).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.resultItem, { padding: 12 }]}
                  onPress={async () => { if (item.url) await WebBrowser.openBrowserAsync(item.url); }}
                >
                  {item.image ? (
                    <View style={styles.itemRow}>
                      <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                      <View style={styles.itemContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={styles.sourceBadge}><Text style={styles.metaText}>{item.source}</Text></View>
                          <Text style={styles.metaText}>{formatDate(item.publishedAt)}</Text>
                        </View>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.itemSummary} numberOfLines={2}>{item.summary}</Text>
                        <Text style={styles.readMore}>Read more →</Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={styles.sourceBadge}><Text style={styles.metaText}>{item.source}</Text></View>
                          <Text style={styles.metaText}>{formatDate(item.publishedAt)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.itemTitle, { marginTop: 8 }]} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.itemSummary} numberOfLines={3}>{item.summary}</Text>
                      <Text style={styles.readMore}>Read more →</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
      </LinearGradient>
    </SafeAreaView>
  );

}


