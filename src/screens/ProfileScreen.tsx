import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

type GoogleUser = {
  picture?: string;
  name?: string;
  email?: string;
};

export default function ProfileScreen() {
  // Log the actual redirect URI used by AuthSession (for Google Cloud Console setup)
  // For local development reference (not for Google OAuth):
  console.log('Local dev URI:', 'exp://192.168.1.151:8081');
  console.log('Redirect URI:', makeRedirectUri());
  const [user, setUser] = useState<GoogleUser | null>(null);

  // Provide your OAuth client ID via env or replace the fallback string.
  // For Expo Go dev, useProxy: true makes redirects easy.
  // Use the correct redirect URI for Expo Go and standalone builds
  // For Expo Go, this will be https://auth.expo.io/@nm2tech/nm2-bibleai
  // For standalone/dev client, this will be nm2bibleai://
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '1046280433703-1k5vca96tcktah838dr7ksr48lv3uuv1.apps.googleusercontent.com',
  redirectUri: makeRedirectUri(),
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (response?.type === 'success' && response.authentication?.accessToken) {
        try {
          const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${response.authentication.accessToken}` },
          });
          const data = await res.json();
          setUser(data);
        } catch (e) {
          console.warn('Failed to fetch Google profile:', e);
        }
      }
    };
    fetchProfile();
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View style={styles.profileBox}>
          {!!user.picture && <Image source={{ uri: user.picture }} style={styles.avatar} />}
          {!!user.name && <Text style={styles.name}>{user.name}</Text>}
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.googleButton, !request && { opacity: 0.6 }]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}
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
});