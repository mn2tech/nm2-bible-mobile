


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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBarAbsolute: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 10,
    width: '90%',
    alignSelf: 'center',
    // You can adjust top/left for initial position as needed
  },
  searchIcon: {
    marginRight: 12,
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


import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';




export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [response, setResponse] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [loading, setLoading] = useState(false);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulate Groq/API call
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResponse('');
    setStreamedText('');
    // Simulate API delay and response
    setTimeout(() => {
      let fakeResponse = '';
      if (searchQuery.toLowerCase().includes('love')) {
        fakeResponse = 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.';
      } else if (searchQuery.toLowerCase().includes('strength')) {
        fakeResponse = 'I can do all this through him who gives me strength.';
      } else if (searchQuery.toLowerCase().includes('purpose')) {
        fakeResponse = 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.';
      } else {
        fakeResponse = 'No results found.';
      }
      setResponse(fakeResponse);
      setLoading(false);
    }, 800);
  };

  // Typing effect for dynamic response
  useEffect(() => {
    if (!response) return;
    setStreamedText('');
    let i = 0;
    if (streamInterval.current) clearInterval(streamInterval.current);
    streamInterval.current = setInterval(() => {
      if (i < response.length) {
        setStreamedText((prev) => prev + response[i]);
        i++;
      } else {
        if (streamInterval.current) clearInterval(streamInterval.current);
      }
    }, 18);
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, [response]);

  // PanResponder and Animated for draggable search bar
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any).__getValue(),
          y: (pan.y as any).__getValue(),
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Scripture</Text>
      </View>

      {/* Absolutely positioned draggable search bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          styles.searchBarAbsolute,
          { transform: pan.getTranslateTransform() }
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search verses, topics, or keywords..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>


      {/* Search button and response area */}
      <View style={styles.resultsContainer}>
        <TouchableOpacity
          style={[styles.resultItem, { marginBottom: 20, backgroundColor: '#6366f1', alignItems: 'center' }]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? 'Searching...' : 'Search'}</Text>
        </TouchableOpacity>
        {response !== '' && (
          <View style={styles.resultItem}>
            <Text style={styles.verseText}>{streamedText}</Text>
          </View>
        )}
      </View>

      {/* Floating Stop Button */}
      <TouchableOpacity
        style={styles.stopButton}
        activeOpacity={0.7}
        onPress={() => {
          // Stop the streaming effect and show full text
          if (streamInterval.current) clearInterval(streamInterval.current);
          setStreamedText(response);
        }}
        accessibilityLabel="Stop"
      >
        <View style={styles.stopButtonInner}>
          <Ionicons name="stop" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


