import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, FavoriteVerse, ReadingHistory, UserPreferences } from '../types/UserData';

const getUserDataKey = (userId: string) => `user_profile_${userId}`;

export class UserDataService {
  private static instance: UserDataService;
  private userProfile: UserProfile | null = null;

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  async initializeUser(googleUser: any): Promise<UserProfile> {
    const userId = googleUser.email || googleUser.name || Date.now().toString();
    console.log('UserDataService: Initializing user with ID:', userId, 'from Google user:', { email: googleUser.email, name: googleUser.name });
    
    const userProfile: UserProfile = {
      id: userId,
      name: googleUser.name || '',
      email: googleUser.email || '',
      picture: googleUser.picture,
      favorites: [],
      readingHistory: [],
      preferences: {
        theme: 'dark',
        notifications: true,
        dailyReminder: false,
      },
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    console.log('UserDataService: Created profile:', userProfile);
    await this.saveUserProfile(userProfile);
    this.userProfile = userProfile;
    return userProfile;
  }

  async loadUserProfile(userId?: string): Promise<UserProfile | null> {
    if (!userId) {
      console.log('UserDataService: No userId provided to loadUserProfile');
      return null;
    }
    
    try {
      const key = getUserDataKey(userId);
      console.log('UserDataService: Loading profile with key:', key);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        console.log('UserDataService: Found stored profile data');
        const profile = JSON.parse(data);
        // Convert date strings back to Date objects
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActiveAt = new Date(profile.lastActiveAt);
        profile.favorites = profile.favorites.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt),
        }));
        profile.readingHistory = profile.readingHistory.map((history: any) => ({
          ...history,
          timestamp: new Date(history.timestamp),
        }));
        this.userProfile = profile;
        console.log('UserDataService: Loaded profile with', profile.favorites.length, 'favorites');
        return profile;
      } else {
        console.log('UserDataService: No stored profile found for key:', key);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
    return null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const key = getUserDataKey(profile.id);
      console.log('UserDataService: Saving profile with key:', key, 'Profile:', profile);
      await AsyncStorage.setItem(key, JSON.stringify(profile));
      this.userProfile = profile;
      console.log('UserDataService: Profile saved successfully');
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  async addFavoriteVerse(verse: Omit<FavoriteVerse, 'id' | 'addedAt'>): Promise<void> {
    if (!this.userProfile) {
      console.log('UserDataService: No user profile found, cannot add favorite');
      return;
    }

    const newFavorite: FavoriteVerse = {
      ...verse,
      id: Date.now().toString(),
      addedAt: new Date(),
    };

    console.log('UserDataService: Adding favorite verse:', newFavorite);
    this.userProfile.favorites.push(newFavorite);
    await this.saveUserProfile(this.userProfile);
    console.log('UserDataService: Favorite verse saved, total favorites:', this.userProfile.favorites.length);
  }

  async removeFavoriteVerse(verseId: string): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.favorites = this.userProfile.favorites.filter(fav => fav.id !== verseId);
    await this.saveUserProfile(this.userProfile);
  }

  async removeFavoriteVerseByReference(reference: string): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.favorites = this.userProfile.favorites.filter(fav => fav.reference !== reference);
    await this.saveUserProfile(this.userProfile);
  }

  async addReadingHistory(history: Omit<ReadingHistory, 'id' | 'timestamp'>): Promise<void> {
    if (!this.userProfile) return;

    const newHistory: ReadingHistory = {
      ...history,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    this.userProfile.readingHistory.unshift(newHistory); // Add to beginning
    // Keep only last 100 entries
    if (this.userProfile.readingHistory.length > 100) {
      this.userProfile.readingHistory = this.userProfile.readingHistory.slice(0, 100);
    }

    await this.saveUserProfile(this.userProfile);
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.preferences = { ...this.userProfile.preferences, ...preferences };
    await this.saveUserProfile(this.userProfile);
  }

  async clearUserData(userId?: string): Promise<void> {
    if (!userId) return;
    
    try {
      await AsyncStorage.removeItem(getUserDataKey(userId));
      this.userProfile = null;
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  getCurrentProfile(): UserProfile | null {
    return this.userProfile;
  }

  getFavorites(): FavoriteVerse[] {
    return this.userProfile?.favorites || [];
  }

  getReadingHistory(): ReadingHistory[] {
    return this.userProfile?.readingHistory || [];
  }
}
