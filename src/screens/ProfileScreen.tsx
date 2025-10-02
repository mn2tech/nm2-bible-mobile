import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIdentityService } from '../services/GoogleIdentityService';

export default function ProfileScreen() {
  const { user, setUser, signOut, userProfile, isAuthenticated } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔍 ProfileScreen - Platform:', Platform.OS);
  console.log('🔍 ProfileScreen - User:', user ? 'Logged in' : 'Not logged in');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);

      console.log('🔐 Starting Google Sign-In...');
      const googleUser = await GoogleIdentityService.signIn();
      
      if (googleUser) {
        console.log('✅ Google Sign-In successful:', googleUser);
        console.log('🔄 Calling setUser with:', googleUser);
        await setUser(googleUser);
        console.log('✅ setUser completed');
        setAuthError(null);
      } else {
        console.log('❌ Google Sign-In failed or cancelled');
        setAuthError('Sign-in was cancelled or failed. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      setAuthError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out...');
      await GoogleIdentityService.signOut();
      await signOut();
      setAuthError(null);
      console.log('✅ Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
      setAuthError('Sign-out failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {user ? (
        <View style={styles.profileBox}>
          {!!user.picture && <Image source={{ uri: user.picture }} style={styles.avatar} />}
          {!!user.name && <Text style={styles.name}>{user.name}</Text>}
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
          
          {/* User Stats */}
          {userProfile && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.favorites.length}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.readingHistory.length}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.floor((Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={styles.signOutButtonText}>
              {isLoading ? 'Signing out...' : 'Sign out'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.googleButton, isLoading && { opacity: 0.6 }]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>
      )}
      
      {!!authError && (
        <Text style={{ color: '#fca5a5', marginTop: 12 }}>{authError}</Text>
      )}
      
      <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
        Platform: {Platform.OS} | Using {Platform.OS === 'web' ? 'Web OAuth' : 'Native Google Sign-In'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  profileBox: {
    alignItems: 'center',
    backgroundColor: '#23272f',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    color: '#e5e7eb',
    fontSize: 16,
    marginBottom: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 32,
    marginTop: 24,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});