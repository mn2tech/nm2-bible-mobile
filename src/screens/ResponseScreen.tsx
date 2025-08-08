import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/HomeStackNavigator';
import GroqBibleService from '../services/groqService';

interface GalleryImage {
  url: string;
  caption?: string;
}

const { width, height } = Dimensions.get('window');

type ResponseScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Response'>;
type ResponseScreenRouteProp = RouteProp<HomeStackParamList, 'Response'>;

interface ResponseScreenProps {
  route: ResponseScreenRouteProp;
  navigation: ResponseScreenNavigationProp;
}


export default function ResponseScreen({ route, navigation }: ResponseScreenProps) {
  const { question, answer, references, images = [] } = route.params;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState([
    {
      question,
      answer,
      references,
      images,
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();


    // Streaming response logic
    setDisplayedText('');
    setIsTyping(true);
    let isMounted = true;
    // Scroll to bottom immediately as soon as streaming starts
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    GroqBibleService.streamBibleAnswer(
      question,
      (partial) => {
        if (isMounted) {
          setDisplayedText(partial);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        }
      },
      (full) => {
        if (isMounted) {
          setIsTyping(false);
          setMessages([{ question, answer: full, references, images }]);
        }
      },
      (err) => {
        if (isMounted) {
          setDisplayedText('Sorry, I encountered an error while processing your question. Please try again.');
          setIsTyping(false);
        }
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      isMounted = false;
    };
  }, [question, fadeAnim]);

  const handleShare = () => {
    // Add share functionality here
    console.log('Sharing response...');
  };

  const handleCopy = () => {
    // Add copy functionality here
    console.log('Copying response...');
  };

  const handleFollowUp = async () => {
    if (!followUpQuery.trim()) return;
          {!isTyping && (
            <Animated.View
              style={[
                styles.floatingSearchContainer,
                {
                  opacity: fadeAnim,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: insets.bottom,
                  zIndex: 100,
                },
              ]}
            >
              <View style={[styles.floatingSearchBar, styles.floatingSearchBarGlow]}>
                <Ionicons name="attach-outline" size={20} color="#9ca3af" style={styles.attachIcon} />
                <TextInput
                  style={styles.floatingSearchInput}
                  placeholder="Ask follow-up..."
                  placeholderTextColor="#6b7280"
                  multiline
                  value={followUpQuery}
                  onChangeText={setFollowUpQuery}
                  onSubmitEditing={handleFollowUp}
                  autoFocus={true}
                />
                {followUpQuery.trim() ? (
                  <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={handleFollowUp}
                  >
                    <Ionicons name="send" size={18} color="#6366f1" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.micButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
  };

  // Main UI return block
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <LinearGradient
        colors={['#1a1a1a', '#0f1419']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, {display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48, minHeight: 48, marginRight: 8}]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NM2BibleAI</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Content */}
          {/* Show the latest question at the very top, outside the scrollview */}
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Text style={{
              color: '#e5e7eb',
              fontSize: 18,
              fontWeight: '600',
              backgroundColor: 'rgba(99,102,241,0.10)',
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              overflow: 'hidden',
              textAlign: 'center',
              maxWidth: '90%',
            }}>
              {messages[messages.length - 1]?.question}
            </Text>
          </View>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}> 
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {messages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  <View style={styles.questionContainer}>
                    <View style={styles.questionIcon}>
                      <Ionicons name="person-circle" size={32} color="#6366f1" />
                    </View>
                    <View style={styles.questionBubble}>
                      <Text style={styles.questionText}>{msg.question}</Text>
                    </View>
                  </View>
                  <View style={styles.responseContainer}>
                    <View style={styles.aiIcon}>
                      <LinearGradient
                        colors={["#6366f1", "#8b5cf6"]}
                        style={styles.aiIconGradient}
                      >
                        <Ionicons name="sparkles" size={20} color="#ffffff" />
                      </LinearGradient>
                    </View>
                    <LinearGradient
                      colors={["#4f46e5", "#6366f1", "#374151"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.responseBubble}
                    >
                      {/* Image Gallery */}
                      {!isTyping && msg.images && msg.images.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.imageGallery}
                          contentContainerStyle={styles.imageGalleryContent}
                        >
                          {(msg.images as GalleryImage[]).map((img: GalleryImage, idx: number) => (
                            <View key={idx} style={styles.imageCard}>
                              <View style={styles.imageWrapper}>
                                <Image
                                  source={{ uri: img.url }}
                                  style={styles.responseImage}
                                  resizeMode="cover"
                                />
                              </View>
                              {img.caption ? (
                                <Text style={styles.imageCaption}>{img.caption}</Text>
                              ) : null}
                            </View>
                          ))}
                        </ScrollView>
                      )}
                      <Text style={styles.responseText}>
                        {/* Only animate typing for the last message */}
                        {idx === messages.length - 1 && isTyping
                          ? displayedText.split(/(\[\d+\])/g).map((part, index) => {
                              const isReference = /^\[\d+\]$/.test(part);
                              if (isReference) {
                                return (
                                  <Text key={index} style={styles.inlineReference}>
                                    {part}
                                  </Text>
                                );
                              }
                              return <Text key={index}>{part}</Text>;
                            })
                          : msg.answer.split(/(\[\d+\])/g).map((part, index) => {
                              const isReference = /^\[\d+\]$/.test(part);
                              if (isReference) {
                                return (
                                  <Text key={index} style={styles.inlineReference}>
                                    {part}
                                  </Text>
                                );
                              }
                              return <Text key={index}>{part}</Text>;
                            })}
                      </Text>
                      {/* Only show cursor for last message if typing */}
                      {idx === messages.length - 1 && isTyping && (
                        <View style={styles.cursor}>
                          <Animated.View style={styles.cursorBlink} />
                        </View>
                      )}
                      {/* References */}
                      {!isTyping && msg.references && msg.references.length > 0 && (
                        <View style={styles.referencesContainer}>
                          <Text style={styles.referencesTitle}>Sources</Text>
                          {msg.references.map((ref, index) => (
                            <TouchableOpacity key={index} style={styles.referenceItem}>
                              <View style={styles.referenceNumber}>
                                <Text style={styles.referenceNumberText}>{index + 1}</Text>
                              </View>
                              <View style={styles.referenceContent}>
                                <Text style={styles.referenceText}>{ref}</Text>
                                <Text style={styles.referenceDomain}>Bible</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {/* Action Icons under response */}
                      {!isTyping && (
                        <View style={styles.responseActionIcons}>
                          <TouchableOpacity style={styles.responseIconButton} onPress={handleShare}>
                            <Ionicons name="share-outline" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.responseIconButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="refresh-outline" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.responseIconButton} onPress={handleCopy}>
                            <Ionicons name="copy-outline" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.responseIconButton}>
                            <Ionicons name="headset-outline" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.responseIconButton}>
                            <Ionicons name="ellipsis-horizontal" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {/* Follow-up suggestions (static for now) */}
                      {!isTyping && idx === messages.length - 1 && (
                        <View style={{ marginTop: 24 }}>
                          {[
                            "Historical accounts of Jesus' life",
                            'Jesus in Jewish tradition and law',
                            "Significance of Jesus' crucifixion",
                            "Jesus' teachings in the Gospels",
                            'Influence of Jesus on Christian theology',
                          ].map((suggestion, sIdx) => (
                            <TouchableOpacity
                              key={sIdx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 16,
                                borderBottomWidth: sIdx < 4 ? 1 : 0,
                                borderBottomColor: '#23272f',
                              }}
                              onPress={() => setFollowUpQuery(suggestion)}
                            >
                              <Ionicons name="return-down-forward" size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                              <Text style={{ color: '#e5e7eb', fontSize: 16 }}>{suggestion}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                </React.Fragment>
              ))}
              {/* Typing indicator for last message only */}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDots}>
                    <Animated.View style={[styles.dot, styles.dot1]} />
                    <Animated.View style={[styles.dot, styles.dot2]} />
                    <Animated.View style={[styles.dot, styles.dot3]} />
                  </View>
                  <Text style={styles.typingText}>Bible AI is typing...</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
          {/* Floating Search Bar - Appears at bottom over tab bar after response is complete */}
          {!isTyping && (
            <Animated.View style={[
              styles.floatingSearchContainer,
              {
                opacity: fadeAnim,
                bottom: 60 + insets.bottom,
              }
            ]}>
              <View style={[styles.floatingSearchBar, styles.floatingSearchBarGlow]}>
                <Ionicons name="attach-outline" size={20} color="#9ca3af" style={styles.attachIcon} />
                <TextInput
                  style={styles.floatingSearchInput}
                  placeholder="Ask follow-up..."
                  placeholderTextColor="#6b7280"
                  multiline
                  value={followUpQuery}
                  onChangeText={setFollowUpQuery}
                  onSubmitEditing={handleFollowUp}
                  autoFocus={true}
                />
                {followUpQuery.trim() ? (
                  <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={handleFollowUp}
                  >
                    <Ionicons name="send" size={18} color="#6366f1" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.micButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageGallery: {
    marginBottom: 12,
    marginHorizontal: -10,
  },
  imageGalleryContent: {
    paddingHorizontal: 10,
    gap: 12,
  },
  imageCard: {
    backgroundColor: '#23272f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    width: 120,
    marginRight: 8,
    alignItems: 'center',
    padding: 6,
  },
  imageWrapper: {
    width: 108,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  responseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageCaption: {
    color: '#e5e7eb',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 2,
    borderColor: '#6366f1',
    minWidth: 40,
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Extra space for floating search bar above tab bar
  },
  questionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  questionIcon: {
    marginRight: 12,
    marginBottom: 4,
  },
  questionBubble: {
    backgroundColor: '#6366f1',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: width * 0.75,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  responseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  aiIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  aiIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBubble: {
    backgroundColor: '#374151',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: width * 0.85,
    flex: 1,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  responseText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 26,
  },
  inlineReference: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  cursor: {
    marginLeft: 2,
    marginTop: 2,
  },
  cursorBlink: {
    width: 2,
    height: 20,
    backgroundColor: '#6366f1',
  },
  referencesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  referencesTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  referenceNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  referenceNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  referenceContent: {
    flex: 1,
  },
  referenceText: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  referenceDomain: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  responseActionIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  responseIconButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 44,
    marginTop: 8,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
    marginHorizontal: 2,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  typingText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  askAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  askAnotherText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  floatingSearchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    paddingTop: 15,
    paddingBottom: 15,
  },
  floatingSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 32,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 8,
    minHeight: 56,
    overflow: 'visible',
  },
  floatingSearchBarGlow: {
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  attachIcon: {
    marginRight: 10,
  },
  floatingSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  micButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#23272f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButton: {
    marginLeft: 10,
    padding: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
});
