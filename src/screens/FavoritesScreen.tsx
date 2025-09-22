import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { FavoriteVerse } from '../types/UserData';

export default function FavoritesScreen() {
  const { userProfile, userDataService, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      setFavorites(userProfile.favorites);
    } else {
      setFavorites([]);
    }
  }, [userProfile, isAuthenticated]);


  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && userProfile) {
      setFavorites(userProfile.favorites);
    }
    setRefreshing(false);
  };

  const toggleFavorite = async (verseId: string) => {
    try {
      await userDataService.removeFavoriteVerse(verseId);
      setFavorites(prev => prev.filter(fav => fav.id !== verseId));
      Alert.alert('Removed!', 'Verse removed from your favorites.');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite. Please try again.');
    }
  };

  const renderFavorite = ({ item }: { item: FavoriteVerse }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteContent}>
        <Text style={styles.reference}>{item.reference}</Text>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.date}>
          Added {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons name="heart" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>Sign in to save favorites</Text>
          <Text style={styles.emptySubtitle}>
            Your favorite Bible verses will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Verses</Text>
        <Text style={styles.subtitle}>
          {favorites.length} saved verse{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any verse to save it
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
          </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  listContainer: {
    padding: 20,
  },
  favoriteItem: {
    backgroundColor: '#23272f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  favoriteContent: {
    flex: 1,
    marginRight: 12,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  heartButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});