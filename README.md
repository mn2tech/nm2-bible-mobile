# NM2BibleAI - Mobile Bible Application

A modern, dark-themed mobile Bible application built with React Native and Expo, inspired by the clean design of Perplexity AI.

## Features

- 📱 **Cross-platform** - Works on both iOS and Android
- 🌙 **Dark Theme** - Beautiful dark interface for comfortable reading
- 🔍 **Search Functionality** - Search through Bible verses and topics
- 📖 **Daily Reading** - Structured daily Bible reading plans
- ❤️ **Favorites** - Save and organize your favorite verses
- 🎨 **Modern UI** - Clean, minimalist design inspired by Perplexity AI

## Screenshots

The app features a modern interface with:
- Clean header with branding and navigation
- Centered logo with inspirational tagline
- Intuitive search bar with voice input capability
- Bottom tab navigation for easy access to all features

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Vector Icons** for iconography
- **Expo Linear Gradient** for beautiful backgrounds

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd perplex_bibleai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Download the Expo Go app from the App Store or Google Play
   - Scan the QR code displayed in the terminal or browser
   - The app will load on your device

### Development Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
│   └── BottomTabNavigator.tsx
├── screens/            # Main application screens
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── ReadingScreen.tsx
│   └── FavoritesScreen.tsx
└── types/              # TypeScript type definitions
```

## Design System

### Colors
- **Background**: `#1a1a1a` (Dark gray)
- **Surface**: `#374151` (Medium gray)
- **Primary**: `#6366f1` (Indigo)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#e5e7eb` (Light gray)
- **Text Muted**: `#6b7280` (Gray)

### Typography
- **Headers**: 24px, weight 600
- **Body**: 16px, line height 24px
- **Captions**: 14px

## Features in Detail

### Home Screen
- Welcome interface with app branding
- Inspirational tagline: "Where wisdom begins"
- Quick search functionality
- Voice input capability

### Search Screen
- Full-text search through Bible verses
- Topic-based search
- Quick access to popular verses
- Search history and suggestions

### Reading Screen
- Daily Bible reading plans
- Chapter and verse navigation
- Comfortable reading typography
- Progress tracking

### Favorites Screen
- Save favorite verses
- Organize by topics or books
- Easy sharing functionality
- Quick access to saved content

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by Perplexity AI
- Bible text from public domain sources
- Built with React Native and Expo
- Icons from Expo Vector Icons
