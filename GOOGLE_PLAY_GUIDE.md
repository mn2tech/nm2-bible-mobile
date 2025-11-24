# 🚀 Google Play Store Publishing Guide

## Prerequisites

1. **Google Play Console Account** - Sign up at [play.google.com/console](https://play.google.com/console)
2. **Developer Registration Fee** - $25 one-time fee
3. **EAS CLI** - Install with `npm install -g @expo/eas-cli`

## Step 1: Prepare App Assets

### Required Images (Create these in your assets folder):
- **App Icon**: 512x512px PNG (already have: `./assets/icon.png`)
- **Feature Graphic**: 1024x500px PNG (for Play Store listing)
- **Screenshots**: 
  - Phone: 1080x1920px or 1080x2340px (at least 2, max 8)
  - Tablet: 1200x1920px (optional)
- **App Icon (Play Store)**: 512x512px PNG

### App Store Listing Requirements:
- **App Name**: NM2BibleAI
- **Short Description**: 80 characters max
- **Full Description**: 4000 characters max
- **Category**: Books & Reference or Lifestyle
- **Content Rating**: Everyone or Teen

## Step 2: Build Production APK

### Install EAS CLI (if not already installed):
```bash
npm install -g @expo/eas-cli
```

### Login to EAS:
```bash
eas login
```

### Configure EAS (if not already done):
```bash
eas build:configure
```

### Build Production APK:
```bash
npm run build:android
```

This will create an APK file that you can upload to Google Play Console.

## Step 3: Google Play Console Setup

### 1. Create New App
- Go to [Google Play Console](https://play.google.com/console)
- Click "Create app"
- Fill in app details:
  - **App name**: NM2BibleAI
  - **Default language**: English
  - **App or game**: App
  - **Free or paid**: Free
  - **User data**: No, this app does not collect user data

### 2. App Access
- **App availability**: Available to all countries
- **User data**: No data collection

### 3. Content Rating
- Complete the content rating questionnaire
- Select appropriate age rating

### 4. Target Audience
- **Primary target audience**: Adults 18+
- **Secondary target audience**: Teens 13-17

### 5. Ads
- **Contains ads**: No (unless you plan to add ads later)

## Step 4: Upload APK

### 1. Go to "Production" track
### 2. Click "Create new release"
### 3. Upload your APK file
### 4. Add release notes (what's new in this version)

## Step 5: Store Listing

### Required Information:
- **App name**: NM2BibleAI
- **Short description**: "AI-powered Bible companion for spiritual guidance and study"
- **Full description**: 
```
Discover the power of AI-enhanced Bible study with NM2BibleAI. This innovative app combines traditional scripture with modern artificial intelligence to provide personalized spiritual guidance, answer your questions about faith, and help you deepen your understanding of the Bible.

Features:
• AI-powered Bible study assistance
• Personalized spiritual guidance
• Interactive Q&A about scripture
• Beautiful, intuitive interface
• Offline reading capabilities
• Cross-platform synchronization

Whether you're a lifelong believer or just beginning your spiritual journey, NM2BibleAI is your trusted companion for exploring God's word with the help of cutting-edge technology.

Perfect for:
- Daily Bible study
- Spiritual growth
- Understanding complex scripture
- Finding answers to faith questions
- Personal devotion time
- Group study preparation

Download NM2BibleAI today and experience the future of Bible study.
```

### App Category:
- **Category**: Books & Reference
- **Tags**: bible, ai, spiritual, christian, study, prayer

## Step 6: Privacy Policy

Create a privacy policy and host it online. Required for apps that handle user data.

### Sample Privacy Policy Points:
- Data collection (Google Sign-In)
- Data usage
- Data sharing
- User rights
- Contact information

## Step 7: Review and Publish

### 1. Review all information
### 2. Submit for review
### 3. Wait for Google's approval (usually 1-3 days)
### 4. App goes live on Google Play Store

## Important Notes

### Google Sign-In Configuration:
- Your app is already configured with Google Sign-In
- Make sure the SHA-1 fingerprint is added to Google Cloud Console
- Test the sign-in flow before publishing

### Version Management:
- Use semantic versioning (1.0.0, 1.0.1, etc.)
- Update versionCode in app.json for each release
- Use `eas build` for consistent builds

### Testing:
- Test on multiple Android devices
- Test all features thoroughly
- Ensure Google Sign-In works properly
- Test offline functionality

## Commands Summary

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Configure EAS (if needed)
eas build:configure

# Build production APK
npm run build:android

# Build preview APK (for testing)
npm run build:preview

# Submit to Google Play (after initial setup)
npm run submit:android
```

## Support

For issues with:
- **EAS Build**: Check [Expo EAS documentation](https://docs.expo.dev/build/introduction/)
- **Google Play Console**: Check [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- **App Configuration**: Check this project's documentation

Good luck with your app launch! 🎉


