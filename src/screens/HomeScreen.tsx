import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import Groq from '../services/groqService';

  // Resolve possible import shapes at runtime: some bundlers add a `.default` wrapper.
  const getGroq = () => {
    const mod = Groq as any;
    return mod && (mod.default ?? mod);
  };


function HomeScreen() {
  const { user, isAuthenticated, userProfile, userDataService } = useAuth();
  const navigation = useNavigation();
  const [savedVerses, setSavedVerses] = useState<Set<string>>(new Set());

  // Debug logging
  console.log('HomeScreen render:', { 
    isAuthenticated, 
    user: user?.name, 
    picture: user?.picture,
    userProfile: !!userProfile 
  });

  // Initialize saved verses from user profile
  useEffect(() => {
    if (userProfile && userProfile.favorites) {
      const favoriteReferences = new Set(userProfile.favorites.map(fav => fav.reference));
      setSavedVerses(favoriteReferences);
    }
  }, [userProfile]);
  
  interface BibleResponse {
    answer: string;
    references?: string[];
  }

  const { width, height } = Dimensions.get('window');
  const isSmallScreen = height < 700;
  const isVerySmallScreen = height < 650;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [response, setResponse] = useState<BibleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [imageSessionId, setImageSessionId] = useState<string | null>(null);
  const [useMockUpload, setUseMockUpload] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const backgroundPhrases = [
  'We named the app mAIchael because it combines Archangel Michael - a symbol of protection, clarity, and guidance - with AI: a helpful, guiding companion that points you to Scripture and insight in times of need.',
  'Archangel Michael is traditionally seen as the protector and leader of the heavenly hosts - a figure of courage, justice, and faithful vigilance.',
    'Michael stands as a guardian in times of trial, defending truth and offering strength to those who seek courage and deliverance.',
    'Called a warrior of light, Michael brings clarity and protection, helping to dispel fear and guide the faithful toward hope.'
  ];
  const [backgroundPhrase, setBackgroundPhrase] = useState<string>(backgroundPhrases[0]);
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + insets.bottom;
  const headerHeight = 44 + insets.top;
  const availableHeight = height - tabBarHeight - headerHeight;
  const isCompactMode = availableHeight < 500;

  // Compute icon size and position the logo so its bottom aligns with the cross horizontal top
  const iconSize = isCompactMode ? 35 : isVerySmallScreen ? 40 : isSmallScreen ? 45 : 50;
  const crossTopPercent = 0.36; // matches crossHorizontal top in styles
  // Place the top of the logo so the icon's bottom sits at crossTop (subtract iconSize)
  const logoTop = Math.max(headerHeight + 8, Math.round(height * crossTopPercent) - iconSize - 6);

  // (logo animation removed) static logo placement is used

  const handleSaveVerse = async (reference: string, text: string) => {
    console.log('HomeScreen: handleSaveVerse called with:', { reference, text, isAuthenticated, userProfile: !!userProfile });
    
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Please sign in to save verses to your favorites.');
      return;
    }

    try {
      // Check if already saved
      const isAlreadySaved = savedVerses.has(reference);
      console.log('HomeScreen: isAlreadySaved:', isAlreadySaved);
      
      if (isAlreadySaved) {
        // Remove from favorites
        console.log('HomeScreen: Removing favorite verse');
        await userDataService.removeFavoriteVerseByReference(reference);
        setSavedVerses(prev => {
          const newSet = new Set(prev);
          newSet.delete(reference);
          return newSet;
        });
        Alert.alert('Removed!', 'Verse removed from your favorites.');
      } else {
        // Add to favorites
        console.log('HomeScreen: Adding favorite verse');
        await userDataService.addFavoriteVerse({
          reference,
          text: text.trim(),
        });
        setSavedVerses(prev => new Set([...prev, reference]));
        Alert.alert('Saved!', 'Verse added to your favorites.');
      }
    } catch (error) {
      console.error('Failed to save/remove verse:', error);
      Alert.alert('Error', 'Failed to save verse. Please try again.');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setLoading(true);
      setError(null);
      setResponse(null);
      try {
        const context = imageSessionId ? { imageSessionId } : undefined;
        const groq = getGroq();
        
        // Prepare user context for personalized responses
        const userContext = userProfile ? {
          name: userProfile.name,
          recentQuestions: userProfile.readingHistory.slice(0, 5).map(h => h.question),
          favoriteTopics: userProfile.favorites.map(f => f.reference),
        } : undefined;
        
        const result = await groq.queryBible(searchQuery.trim(), userContext);
        setResponse(result);
        
        // Save to reading history if user is logged in
        if (isAuthenticated && userProfile) {
          await userDataService.addReadingHistory({
            question: searchQuery.trim(),
            answer: result.answer,
            references: result.references,
            sessionId: imageSessionId,
          });
        }
      } catch (err) {
        setError('Failed to get response.');
      } finally {
        setLoading(false);
      }
      setSearchQuery('');
    }
  };

  // Sanitize and set an error message for UI (avoid showing 'undefined' or raw objects)
  const setErrorSanitized = (err: any) => {
    console.log('setErrorSanitized:', err);
    let msg = 'An error occurred';
    if (err) {
      if (typeof err === 'string') {
        msg = err;
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      } else if (err && typeof err.message === 'string') {
        msg = err.message;
      } else {
        try {
          msg = String(err);
        } catch (e) {
          msg = 'An error occurred';
        }
      }
    }
    // Guard against literal 'undefined' or empty strings
    if (!msg || msg.trim() === '' || msg === 'undefined' || msg === '(it is undefined)') {
      msg = 'Failed to process image.';
    }
    setError(msg);
  };

  const pushDebug = (msg: string) => {
    console.log('DEBUG:', msg);
    setDebugLogs(prev => [msg, ...prev].slice(0, 10));
  };


  const copyDebugLogs = async () => {
    try {
      const text = debugLogs.length ? debugLogs.join('\n') : 'No debug logs';
      // Try expo-clipboard if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Clipboard = require('expo-clipboard');
        if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
          await Clipboard.setStringAsync(text);
          Alert.alert('Copied', 'Debug logs copied to clipboard');
          return;
        }
      } catch (e) {
        // ignore and try fallback
      }

      // Fallback: try navigator.clipboard (web / some runtimes)
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        // @ts-ignore
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied', 'Debug logs copied to clipboard');
        return;
      }

      // Last resort: show the logs in an alert (truncated)
      Alert.alert('Debug logs', text.length > 1000 ? text.slice(0, 1000) + '... (truncated)' : text);
    } catch (err) {
      Alert.alert('Copy failed', String(err));
    }
  };

  // Pick a random background phrase when the screen mounts
  useEffect(() => {
    try {
      const idx = Math.floor(Math.random() * backgroundPhrases.length);
      setBackgroundPhrase(backgroundPhrases[idx]);
    } catch (e) {
      // ignore
    }
  }, []);


  const openCamera = async () => {
    try {
      // try to load expo-image-picker at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('expo-image-picker');
      const ImagePicker = mod && (mod.default ?? mod);

      if (!ImagePicker || typeof ImagePicker.launchCameraAsync !== 'function') {
        // Try to detect whether we're running inside Expo Go or a custom dev client
        let appOwnership = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Constants = require('expo-constants');
          appOwnership = Constants && Constants.appOwnership;
        } catch (err) {
          // ignore
        }

        const expoGoMessage = appOwnership === 'expo'
          ? 'This Expo Go build does not include the native image-picker module. To use the camera, either run a local dev build (npx expo run:android / run:ios) or create an Expo Development Client that includes native modules.'
          : 'This build does not include the native image-picker module.';

        Alert.alert(
          'Camera not available',
          `${expoGoMessage}\n\nIf you already installed expo-image-picker, rebuild the app so the native module is bundled.`
        );
        return;
      }


      // Permission API shape differs across versions (requestCameraPermissionsAsync | getCameraPermissionsAsync)
      let cameraPerm: any = null;
      if (typeof ImagePicker.requestCameraPermissionsAsync === 'function') {
        cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      } else if (typeof ImagePicker.getCameraPermissionsAsync === 'function') {
        cameraPerm = await ImagePicker.getCameraPermissionsAsync();
      }
      if (cameraPerm && cameraPerm.granted === false) {
        // We'll still offer library pick, but camera will be blocked
        // eslint-disable-next-line no-empty
      }

      const options: any = { quality: 0.7 }; // used for both camera and library
      if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
        options.mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }

      // Shared result handler for camera or library pick
      const handleResult = async (result: any) => {
        const wasCancelled = 'cancelled' in result ? result.cancelled : ('canceled' in result ? result.canceled : false);
        const uri = result.uri ?? (result.assets && result.assets[0] && result.assets[0].uri) ?? null;
        if (!wasCancelled && uri) {
          console.log('Selected image URI:', uri);
          try {
            // Resize/compress image before uploading to save bandwidth
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ImageManipulator = require('expo-image-manipulator');
            let uploadUri = uri;
            try {
              const manipResult = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
              if (manipResult && manipResult.uri) {
                uploadUri = manipResult.uri;
              }
            } catch (manipErr) {
              console.log('Image manipulation failed, falling back to original uri', manipErr);
            }

            // Place the captured (and possibly resized) image URI into the search input so user can see/use it
            setSearchQuery(uploadUri);
            setCapturedImageUri(uploadUri);
            Alert.alert('Selected', 'Image selected. Processing...');
            setLoading(true);
            setError(null);

            // Robust image processing that tries multiple import shapes and logs diagnostics
            const processImage = async (uri: string) => {
              // First try the resolved groq object
              try {
                const groq = getGroq();
                console.log('processImage: resolved groq:', groq);
                if (groq && typeof groq.queryBibleWithImageStream === 'function') {
                  await groq.queryBibleWithImageStream(uri,
                    (partial: string) => setResponse({ answer: partial, references: [] }),
                    (full: string, meta?: { sessionId?: string }) => {
                      setResponse({ answer: full, references: [] });
                      if (meta && meta.sessionId) setImageSessionId(meta.sessionId);
                    },
                    (err: any) => {
                      console.log('Groq image stream error', err);
                      setErrorSanitized(err);
                    }
                  );
                  return;
                }
                if (groq && typeof groq.queryBibleWithImage === 'function') {
                  const res = await groq.queryBibleWithImage(uri);
                  setResponse({ answer: res.answer, references: res.references || [] });
                  if (res && (res as any).sessionId) setImageSessionId((res as any).sessionId);
                  return;
                }
              } catch (e) {
                console.log('processImage: primary groq attempt failed', e);
              }

              // Second attempt: dynamic require the service module and try its named exports
              try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const mod = require('../services/groqService');
                const candidate = mod && (mod.default ?? mod);
                console.log('processImage: dynamic require returned', { mod, candidate });
                if (candidate && typeof candidate.queryBibleWithImageStream === 'function') {
                  await candidate.queryBibleWithImageStream(uri,
                    (partial: string) => setResponse({ answer: partial, references: [] }),
                    (full: string, meta?: { sessionId?: string }) => {
                      setResponse({ answer: full, references: [] });
                      if (meta && meta.sessionId) setImageSessionId(meta.sessionId);
                    },
                    (err: any) => setErrorSanitized(err)
                  );
                  return;
                }
                if (typeof mod.queryBibleWithImage === 'function') {
                  const res = await mod.queryBibleWithImage(uri);
                  setResponse({ answer: res.answer, references: res.references || [] });
                  if (res && (res as any).sessionId) setImageSessionId((res as any).sessionId);
                  return;
                }
              } catch (dynErr) {
                console.log('processImage: dynamic require attempt failed', dynErr);
              }

                // If we get here, no callable upload method was found
                // If no upload method found, default to mock upload unless explicitly turned off
                if (useMockUpload || useMockUpload === null || useMockUpload === undefined) {
                  pushDebug('No groq upload method found - using mock upload as automatic fallback');
                  // Simulate a streaming upload: partial updates then final with a mock sessionId
                  const mockImageUpload = async (u: string) => {
                    try {
                      setLoading(true);
                      pushDebug(`mockImageUpload: starting for ${u}`);
                      // simulate progressive data
                      await new Promise(r => setTimeout(r, 400));
                      setResponse({ answer: 'Analyzing image...', references: [] });
                      await new Promise(r => setTimeout(r, 800));
                      setResponse({ answer: 'Looks like a person praying. (mock)', references: ['MockRef 1'] });
                      setImageSessionId('mock-session-1234');
                      pushDebug('mockImageUpload: completed, sessionId=mock-session-1234');
                    } catch (e) {
                      pushDebug('mockImageUpload error: ' + String(e));
                      setErrorSanitized(e);
                    } finally {
                      setLoading(false);
                    }
                  };
                  await mockImageUpload(uri);
                } else {
                  setError('Image upload not available in this runtime. Try a dev client or native build.');
                }
            };

            try {
              await processImage(uploadUri);
            } catch (finalErr) {
              console.log('processImage final error', finalErr);
              setErrorSanitized(finalErr);
            }
          } catch (err: any) {
            console.log('Groq image query failed', err);
            setErrorSanitized(err);
          } finally {
            setLoading(false);
          }
        }
      };

      // Helper to launch camera
      const takePhoto = async () => {
        try {
          const result: any = await ImagePicker.launchCameraAsync(options);
          await handleResult(result);
        } catch (e) {
          console.log('launchCameraAsync failed', e);
          setErrorSanitized(e);
        }
      };

      // Helper to pick from library (request permission shape may vary)
      const pickFromLibrary = async () => {
        try {
          if (typeof ImagePicker.requestMediaLibraryPermissionsAsync === 'function') {
            const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (libPerm && libPerm.granted === false) {
              Alert.alert('Permission required', 'Media library permission is required to choose a photo.');
              return;
            }
          }
          const result: any = await ImagePicker.launchImageLibraryAsync(options);
          await handleResult(result);
        } catch (e) {
          console.log('launchImageLibraryAsync failed', e);
          setErrorSanitized(e);
        }
      };

      // Offer the user a choice: take photo or choose from library
      Alert.alert('Upload image', 'Take a photo or choose from your library', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (e: any) {
      console.log('openCamera failed', e);
      // Surface the underlying error on-device to aid debugging, but keep message concise
      const message = e && e.message ? e.message : String(e);
      Alert.alert(
        'Camera error',
        `Camera failed: ${message}\n\nTry restarting Metro (npx expo start -c) and ensure you run a dev client that includes native modules.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}> 
      {/* Subtle grid background */}
      {!(response && response.answer) && (
        <View pointerEvents="none" style={styles.gridBackground}>
          {/* Stained glass effect: grid of rectangles with subtle color variations */}
          {(() => {
            const rows = 12;
            const cols = 8;
            const colors = [
              'rgba(99,102,241,0.07)', // indigo
              'rgba(255,255,255,0.04)', // white
              'rgba(99,102,241,0.10)', // indigo accent
              'rgba(255,255,255,0.02)', // faint white
              'rgba(99,102,241,0.05)', // faint indigo
            ];
            let panels = [];
            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const color = colors[(row * cols + col) % colors.length];
                panels.push(
                  <View
                    key={`panel-${row}-${col}`}
                    style={{
                      position: 'absolute',
                      left: `${(col) * 100 / cols}%`,
                      top: `${(row) * 100 / rows}%`,
                      width: `${100 / cols}%`,
                      height: `${100 / rows}%`,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.04)',
                      backgroundColor: color,
                    }}
                  />
                );
              }
            }
            return panels;
          })()}
        </View>
      )}
      {/* Jesus cross background - hide when response is shown */}
      {!(response && response.answer) && (
        <View pointerEvents="none" style={styles.crossContainer}>
          {/* Vertical line (center) */}
          <View style={styles.crossVertical} />
          {/* Horizontal line (center) */}
          <View style={styles.crossHorizontal} />
        </View>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { flex: 1 }]}
      >
        <LinearGradient
          colors={['#181a1b', '#232627']} // Perplexity-style gradient
          style={[styles.gradient, { flex: 1 }]}
        >
          {/* Subtle background logo (shows only when there's no response) */}
          {!(response && response.answer) && (
            <>
              <Image
                source={require('../../assets/michaelai_logo.png')}
                resizeMode="contain"
                style={[
                  styles.backgroundLogo,
                  {
                    // Responsive sizing: use a fraction of screen width, cap by a max height
                    width: Math.min(width * 0.85, 900),
                    height: Math.min(260, height * 0.36),
                    // Center vertically around 60% of screen, shift up by half the logo height
                    top: `${60}%`,
                    marginTop: -(Math.min(260, height * 0.36) / 2),
                    // Nudge right proportionally but cap to avoid overflow on small screens
                    transform: [{ translateX: Math.min(0.18 * width, 96) }],
                    // Slightly lower contrast on small screens
                    opacity: Math.min(0.12, height < 680 ? 0.06 : 0.08),
                  },
                ]}
              />
              <View style={styles.backgroundTextWrapper} pointerEvents="none">
                <View style={styles.backgroundTextBackdrop} pointerEvents="none">
                  <Text style={[
                    styles.backgroundText,
                    {
                      // responsive sizing for readability
                      fontSize: isCompactMode ? 14 : 16,
                      lineHeight: isCompactMode ? 20 : 24,
                      color: '#f8fafc',
                    }
                  ]}>
                    {backgroundPhrase}
                  </Text>
                </View>
              </View>
            </>
          )}
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.profileButton, { backgroundColor: '#6366f1' }]}
              onPress={() => {
                console.log('Profile button pressed');
                // Try different navigation methods
                try {
                  const tabNavigation = navigation.getParent();
                  console.log('Tab navigation:', tabNavigation);
                  if (tabNavigation) {
                    (tabNavigation as any).navigate('Profile');
                  } else {
                    // Fallback: try direct navigation
                    (navigation as any).navigate('Profile');
                  }
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {(() => {
                  console.log('Profile button render:', { 
                    isAuthenticated, 
                    userName: user?.name, 
                    userEmail: user?.email,
                    hasUser: !!user,
                    fullUser: user 
                  });
                  if (isAuthenticated && user?.name) {
                    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    console.log('Showing initials:', initials);
                    return <Text style={styles.initialsText}>{initials}</Text>;
                  } else if (isAuthenticated && user?.email) {
                    // Fallback to email if name is not available
                    const emailInitials = user.email.split('@')[0].slice(0, 2).toUpperCase();
                    console.log('Showing email initials:', emailInitials);
                    return <Text style={styles.initialsText}>{emailInitials}</Text>;
                  } else {
                    console.log('Showing default icon');
                    return <Ionicons name="person" size={24} color="#ffffff" />;
                  }
                })()}
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>mAIchael - BibleAI</Text>
              {useMockUpload && (
                <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(99,102,241,0.14)', borderRadius: 8 }}>
                  <Text style={{ color: '#c7c9ff', fontSize: 12 }}>MOCK</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={() => setUseMockUpload(prev => !prev)}>
              <Ionicons name={useMockUpload ? 'cloud-offline-outline' : 'cloud-upload-outline'} size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
          {/* Main Content: logo/tagline only if no response */}
            {!(response && response.answer) && (
            <View style={[styles.mainContent, { height: availableHeight - 140 }]}> 
              {/* Logo/Icon - positioned to sit at the top of the cross */}
              <View style={[styles.logoContainer, { position: 'absolute', left: 0, right: 0, top: logoTop, alignItems: 'center' }]}>
                <Ionicons
                  name="book"
                  size={iconSize}
                  color="#6366f1"
                />
              </View>
              {/* Tagline */}
              <View style={styles.taglineContainer}> 
                <Text style={[styles.taglineText, {  
                  fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28  
                }]}>Where</Text> 
                <Text style={[styles.taglineText, {  
                  fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28  
                }]}>True</Text> 
                <Text style={[styles.taglineText, {  
                  fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28  
                }]}>Wisdom</Text> 
                <Text style={[styles.taglineText, {  
                  fontSize: isCompactMode ? 20 : isVerySmallScreen ? 24 : isSmallScreen ? 26 : 28  
                }]}>Begins</Text> 
              </View>
            </View>
          )}
          {/* Search Section and Response Feed */}
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
              {error && (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#ef4444', fontSize: 16 }}>{error}</Text>
                </View>
              )}
              {response && response.answer && (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ color: '#ffffff', fontSize: 17, flex: 1 }}>{response.answer}</Text>
                    {isAuthenticated && (
                      <TouchableOpacity
                        style={{ padding: 8, marginLeft: 8 }}
                        onPress={() => handleSaveVerse('AI Response', response.answer)}
                      >
                        <Ionicons name="heart-outline" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {response.references && response.references.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: '#6366f1', fontWeight: '600', marginBottom: 8 }}>References:</Text>
                      {response.references.map((ref: string, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ color: '#e5e7eb', fontSize: 15, flex: 1 }}>{ref}</Text>
                          {isAuthenticated && (
                            <TouchableOpacity
                              style={{ padding: 8, marginLeft: 8 }}
                              onPress={() => handleSaveVerse(ref, ref)}
                            >
                              <Ionicons 
                                name={savedVerses.has(ref) ? "heart" : "heart-outline"} 
                                size={18} 
                                color={savedVerses.has(ref) ? "#ef4444" : "#9ca3af"} 
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            {/* Search input always visible at the bottom */}
            <View style={[styles.searchSection, { paddingBottom: insets.bottom + 20 }]}>  
              <View style={styles.searchContainer}>  
                {capturedImageUri ? (
                  <View style={styles.thumbnailWrapper}> 
                    <Image source={{ uri: capturedImageUri }} style={styles.thumbnail} />
                    <TouchableOpacity onPress={() => { setCapturedImageUri(null); setSearchQuery(''); setResponse(null); }} style={styles.clearThumb}>
                      <Ionicons name="close" size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={openCamera} accessibilityLabel="Open camera" style={{ marginRight: 8 }}>
                    <Ionicons name="camera-outline" size={24} color="#ffffff" style={styles.searchIcon} />  
                  </TouchableOpacity>
                )}
                <TextInput  
                  style={styles.searchInput}  
                  placeholder="Ask anything about bible..."  
                  placeholderTextColor="#888888"  
                  value={searchQuery}  
                  onChangeText={setSearchQuery}  
                  selectionColor="#6366f1"  
                  autoCorrect={false}  
                  autoCapitalize="none"  
                  returnKeyType="send"  
                  onSubmitEditing={handleSearch}  
                />  
                <View style={styles.rightControls}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 8 }} />
                  ) : (
                    <TouchableOpacity   
                      style={[styles.micButton, searchQuery.trim() ? styles.sendButton : null]}   
                      onPress={searchQuery.trim() ? handleSearch : undefined}  
                    >  
                      <Ionicons   
                        name={searchQuery.trim() ? "send" : "mic-outline"}   
                        size={24}   
                        color={searchQuery.trim() ? "#6366f1" : "#ffffff"}   
                      />  
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // bring grid above all for debugging
  },
  crossContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossVertical: {
  position: 'absolute',
  top: '30%', // lower the vertical bar so the cross sits lower on the screen
  bottom: '28%',
    left: '50%',
    width: 6,
    marginLeft: -3,
  backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  crossHorizontal: {
    position: 'absolute',
    left: '32%', // Make horizontal line shorter
    right: '32%',
  top: '36%', // move horizontal line down to match the lowered vertical bar
    height: 6,
    marginTop: -3,
  backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#181a1b', // Perplexity-style background
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 44,
    zIndex: 100,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 26, 27, 0.9)',
  },
  profileButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
    padding: 8,
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
  marginTop: 24,
  marginBottom: 20,
  padding: 14,
  borderRadius: 16,
  backgroundColor: 'rgba(31, 41, 55, 0.7)',
  borderWidth: 1,
  borderColor: 'rgba(99,102,241,0.12)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingText: {
    color: '#6366f1',
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  taglineText: {
    fontWeight: '300',
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 3,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.32)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  searchSection: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '400',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    textAlign: 'left',
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  clearThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightControls: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    marginLeft: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
  backgroundLogo: {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  width: '80%',
  height: 260,
  marginTop: -140, // lift the logo higher so background text sits in front
  opacity: 0.06,
  alignSelf: 'center',
  zIndex: 0, // sit above the gradient but behind the cross (cross uses zIndex: 1)
  transform: [{ translateX: 32 }],
  },
  backgroundTextBackdrop: {
  backgroundColor: 'rgba(0,0,0,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    maxWidth: 820,
    alignItems: 'center',
  },
  backgroundTextWrapper: {
    position: 'absolute',
    // Start just below the header/title area (header ~44px plus some padding)
    top: 72,
    left: 20,
    right: 20,
    zIndex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backgroundText: {
  color: '#ffffff',
  fontSize: 16,
  textAlign: 'center',
  lineHeight: 24,
  },
});
