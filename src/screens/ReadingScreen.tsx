import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function ReadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Reading</Text>
        <Text style={styles.subtitle}>Genesis 1:1-10</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>1</Text>
          <Text style={styles.verseText}>
            In the beginning God created the heavens and the earth.
          </Text>
        </View>
        
        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>2</Text>
          <Text style={styles.verseText}>
            Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.
          </Text>
        </View>

        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>3</Text>
          <Text style={styles.verseText}>
            And God said, "Let there be light," and there was light.
          </Text>
        </View>

        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>4</Text>
          <Text style={styles.verseText}>
            God saw that the light was good, and he separated the light from the darkness.
          </Text>
        </View>

        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>5</Text>
          <Text style={styles.verseText}>
            God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 12,
    marginTop: 2,
    minWidth: 20,
  },
  verseText: {
    fontSize: 18,
    color: '#e5e7eb',
    lineHeight: 28,
    flex: 1,
  },
});
