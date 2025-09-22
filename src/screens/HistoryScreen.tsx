import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ReadingHistory } from '../types/UserData';

export default function HistoryScreen() {
  const { userProfile, userDataService, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      setHistory(userProfile.readingHistory);
    }
  }, [userProfile, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && userProfile) {
      setHistory(userProfile.readingHistory);
    }
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderHistoryItem = ({ item }: { item: ReadingHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <Text style={styles.question} numberOfLines={2}>
          {item.question}
        </Text>
        <Text style={styles.answer} numberOfLines={3}>
          {item.answer.replace(/^Q:.*?\n\n/, '')}
        </Text>
        {item.references && item.references.length > 0 && (
          <View style={styles.referencesContainer}>
            <Ionicons name="book-outline" size={14} color="#6366f1" />
            <Text style={styles.references}>
              {item.references.slice(0, 2).join(', ')}
              {item.references.length > 2 && ` +${item.references.length - 2} more`}
            </Text>
          </View>
        )}
        <Text style={styles.timestamp}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>Sign in to view history</Text>
          <Text style={styles.emptySubtitle}>
            Your Bible study history will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reading History</Text>
        <Text style={styles.subtitle}>
          {history.length} question{history.length !== 1 ? 's' : ''} asked
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Start asking questions to build your history
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
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
  historyItem: {
    backgroundColor: '#23272f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyContent: {
    flex: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    marginBottom: 8,
  },
  referencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  references: {
    fontSize: 12,
    color: '#6366f1',
    marginLeft: 4,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
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

