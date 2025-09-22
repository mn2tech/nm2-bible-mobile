import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth, GoogleUser } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { user, setUser, signOut, userProfile, isAuthenticated } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const signedOutRef = useRef<boolean>(false);

  // Provide your OAuth client ID via env or replace the fallback string.
  // For Expo Go dev, useProxy: true makes redirects easy.
  // Use the correct redirect URI for Expo Go and standalone builds
  // For Expo Go, this will be https://auth.expo.io/@nm2tech/nm2-bibleai
  // For standalone/dev client, this will be nm2bibleai://
  const extra = Constants?.expoConfig?.extra as any;
  const androidClientId = extra?.googleAndroidClientId ||
    '1046280433703-q5ic0dg76oc55l3hc7d2n16b3ofh13f1.apps.googleusercontent.com';
  const webClientId = extra?.googleWebClientId ||
    '1046280433703-1k5vca96tcktah838dr7ksr48lv3uuv1.apps.googleusercontent.com';

  // Let Expo handle redirect URIs automatically
  console.log('Platform:', Platform.OS);
  console.log('Using Android Client ID:', Platform.OS === 'android' ? androidClientId : 'N/A');
  console.log('Using Web Client ID:', Platform.OS === 'web' ? webClientId : 'N/A');

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use the correct client ID for each platform
    androidClientId: Platform.OS === 'android' ? androidClientId : undefined,
    webClientId: Platform.OS === 'web' ? webClientId : undefined,
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    console.log('=== AUTH DEBUG ===');
    console.log('Auth response:', response);
    console.log('Response type:', response?.type);
    console.log('Platform:', Platform.OS);
    console.log('Android Client ID:', androidClientId);
    console.log('Web Client ID:', webClientId);
    console.log('Request ready:', !!request);
    console.log('User state:', user);
    console.log('==================');
    
    const fetchProfile = async () => {
      if (signedOutRef.current) {
        return;
      }
      if (response?.type === 'success' && response.authentication?.accessToken) {
        try {
          console.log('✅ SUCCESS: Fetching Google profile with token...');
          console.log('Access token:', response.authentication.accessToken.substring(0, 20) + '...');
          
          // Try legacy userinfo endpoint first
          let data: any | null = null;
          try {
            const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${response.authentication.accessToken}` },
              cache: 'no-store',
            });
            if (res.ok) {
              data = await res.json();
            } else {
              console.warn('Legacy userinfo endpoint returned', res.status);
            }
          } catch (e) {
            console.warn('Legacy userinfo fetch failed, will try OIDC endpoint');
          }

          // Fallback to OIDC userinfo endpoint if needed
          if (!data) {
            const res2 = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.authentication.accessToken}` },
              cache: 'no-store',
            });
            if (!res2.ok) {
              // If token is invalid/expired (e.g., after sign-out), silently ignore
              if (res2.status === 401 || signedOutRef.current) {
                return;
              }
              throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);
            }
            data = await res2.json();
          }

          console.log('✅ Profile data received:', data);
          console.log('ProfileScreen: Setting user data:', { email: data.email, name: data.name });
          setUser(data);
          setAuthError(null);
        } catch (e) {
          if (signedOutRef.current) return;
          console.error('❌ Failed to fetch Google profile:', e);
          setAuthError(`Failed to fetch Google profile: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else if (response?.type === 'error') {
        const errorParams = (response as any)?.params;
        const errorCode = errorParams?.error;
        const errorDescription = errorParams?.error_description;
        const errorUri = errorParams?.error_uri;
        
        console.error('❌ Google auth error details:', {
          error: errorCode,
          description: errorDescription,
          uri: errorUri,
          fullResponse: response
        });
        
        let errorMessage = 'Authentication failed';
        if (errorCode === 'access_denied') {
          errorMessage = 'Access denied. Please try again.';
        } else if (errorCode === 'invalid_request') {
          errorMessage = 'Invalid request. Please check your configuration.';
        } else if (errorDescription) {
          errorMessage = errorDescription;
        } else if (errorCode) {
          errorMessage = `Error: ${errorCode}`;
        }
        
        setAuthError(errorMessage);
      } else if (response?.type === 'dismiss') {
        console.log('⚠️ Sign-in was dismissed by user');
        setAuthError('Sign-in was cancelled');
      } else if (response?.type === 'cancel') {
        console.log('⚠️ Sign-in was cancelled');
        setAuthError('Sign-in was cancelled');
      } else {
        console.log('ℹ️ No response or unknown response type:', response?.type);
      }
    };
    
    if (response) {
      fetchProfile();
    }
  }, [response, user]);

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
            onPress={async () => {
              try {
                signedOutRef.current = true;
                const token = (response as any)?.authentication?.accessToken;
                if (token) {
                  await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(token), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  }).catch(() => {});
                }
              } catch (_) {}
              await signOut();
              setAuthError(null);
            }}
          >
            <Text style={styles.signOutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.googleButton, !request && { opacity: 0.6 }]}
          onPress={() => {
            setAuthError(null);
            promptAsync();
          }}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}
      {!!authError && (
        <Text style={{ color: '#fca5a5', marginTop: 12 }}>{authError}</Text>
      )}
      <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
        Platform: {Platform.OS} | Using Expo OAuth
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