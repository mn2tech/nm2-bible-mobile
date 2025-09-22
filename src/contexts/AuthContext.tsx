import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDataService } from '../services/UserDataService';
import { UserProfile } from '../types/UserData';

export interface GoogleUser {
  picture?: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: GoogleUser | null) => void;
  signOut: () => Promise<void>;
  userDataService: UserDataService;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<GoogleUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userDataService = UserDataService.getInstance();

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('AuthContext: Starting to load user from storage...');
        const storedUser = await AsyncStorage.getItem('user');
        console.log('AuthContext: Stored user data:', storedUser ? 'Found' : 'Not found');
        
        if (storedUser) {
          const googleUser = JSON.parse(storedUser);
          console.log('AuthContext: Parsed Google user:', { email: googleUser.email, name: googleUser.name });
          setUserState(googleUser);
          
          // Load or create user profile (with error handling)
          try {
            const userId = googleUser.email || googleUser.name || Date.now().toString();
            console.log('AuthContext: Loading profile for userId:', userId);
            let profile = await userDataService.loadUserProfile(userId);
            if (!profile) {
              console.log('AuthContext: No existing profile found, creating new one');
              profile = await userDataService.initializeUser(googleUser);
            } else {
              console.log('AuthContext: Loaded existing profile with', profile.favorites.length, 'favorites');
            }
            setUserProfile(profile);
          } catch (profileError) {
            console.error('Failed to load user profile:', profileError);
            // Continue without profile if there's an error
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const setUser = async (newUser: GoogleUser | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        
        // Initialize or load user profile (with error handling)
        try {
          const userId = newUser.email || newUser.name || Date.now().toString();
          console.log('AuthContext: Loading profile for userId:', userId);
          let profile = await userDataService.loadUserProfile(userId);
          if (!profile) {
            console.log('AuthContext: No existing profile found, creating new one');
            profile = await userDataService.initializeUser(newUser);
          } else {
            console.log('AuthContext: Loaded existing profile with', profile.favorites.length, 'favorites');
          }
          setUserProfile(profile);
        } catch (profileError) {
          console.error('Failed to initialize user profile:', profileError);
          // Continue without profile if there's an error
        }
      } else {
        await AsyncStorage.removeItem('user');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      // Don't clear user data - just clear the current user state
      // The profile data should persist for when they sign back in
      setUserState(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
  };

  // Function to refresh user profile from storage
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userId = user.email || user.name || Date.now().toString();
        const profile = await userDataService.loadUserProfile(userId);
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    signOut,
    userDataService: {
      ...userDataService,
      addFavoriteVerse: async (verse) => {
        await userDataService.addFavoriteVerse(verse);
        await refreshUserProfile();
      },
      removeFavoriteVerse: async (verseId) => {
        await userDataService.removeFavoriteVerse(verseId);
        await refreshUserProfile();
      },
      removeFavoriteVerseByReference: async (reference) => {
        await userDataService.removeFavoriteVerseByReference(reference);
        await refreshUserProfile();
      },
      addReadingHistory: async (history) => {
        await userDataService.addReadingHistory(history);
        await refreshUserProfile();
      },
      updatePreferences: async (preferences) => {
        await userDataService.updatePreferences(preferences);
        await refreshUserProfile();
      },
      clearUserData: userDataService.clearUserData.bind(userDataService),
      loadUserProfile: userDataService.loadUserProfile.bind(userDataService),
      saveUserProfile: userDataService.saveUserProfile.bind(userDataService),
      initializeUser: userDataService.initializeUser.bind(userDataService),
      getCurrentProfile: userDataService.getCurrentProfile.bind(userDataService),
      getFavorites: userDataService.getFavorites.bind(userDataService),
      getReadingHistory: userDataService.getReadingHistory.bind(userDataService),
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
