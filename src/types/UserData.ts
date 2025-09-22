export interface FavoriteVerse {
  id: string;
  reference: string;
  text: string;
  addedAt: Date;
  tags?: string[];
}

export interface ReadingHistory {
  id: string;
  question: string;
  answer: string;
  references?: string[];
  timestamp: Date;
  sessionId?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  dailyReminder: boolean;
  reminderTime?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  favorites: FavoriteVerse[];
  readingHistory: ReadingHistory[];
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

