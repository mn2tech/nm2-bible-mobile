import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
// Using dynamic require to avoid type issues if expo-video types aren't installed
export default function VideoScreen({ route }: { route?: any }) {
  const uri = route?.params?.uri || null;
  let VideoComp: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    VideoComp = require('expo-video').Video;
  } catch (e) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      VideoComp = require('expo-av').Video;
    } catch (e2) {
      VideoComp = null;
    }
  }

  return (
    <View style={styles.container}>
      {uri ? (
        VideoComp ? <VideoComp source={{ uri }} useNativeControls shouldPlay style={styles.video} /> : <Text style={{ color: '#fff' }}>No video player available</Text>
      ) : (
        <Text style={{ color: '#fff' }}>No video provided</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  video: { width: '100%', height: '100%' },
});
