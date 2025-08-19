import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Vibration,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';

export default function ReadingScreen() {
  const [minutesInput, setMinutesInput] = useState('5');
  const [secondsInput, setSecondsInput] = useState('0');
  const [durationSec, setDurationSec] = useState<number>(300);
  const [remaining, setRemaining] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const soundRef = useRef<any>(null);
  const AudioRef = useRef<any>(null);

  useEffect(() => {
    const m = parseInt(minutesInput || '0', 10) || 0;
    const s = parseInt(secondsInput || '0', 10) || 0;
    setDurationSec(Math.max(0, m * 60 + s));
  }, [minutesInput, secondsInput]);

  // load expo-av at runtime and try to set audio mode to allow background playback
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const expoAv = require('expo-av');
      AudioRef.current = expoAv.Audio;
      if (AudioRef.current && AudioRef.current.setAudioModeAsync) {
        AudioRef.current.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        }).catch(() => {});
      }
    } catch (e) {
      AudioRef.current = null;
    }
    return () => { /* no-op */ };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const playMusic = async () => {
    try {
      if (soundRef.current) {
        if (soundRef.current.replayAsync) await soundRef.current.replayAsync();
        else if (soundRef.current.playAsync) await soundRef.current.playAsync();
        return;
      }

      const asset = require('../../assets/silent-evening-calm-piano-335749.mp3');
      // prefer expo-av
      if (AudioRef.current && AudioRef.current.Sound) {
        const Sound = AudioRef.current.Sound;
        // Sound.createAsync may exist on Audio.Sound in some expo-av versions
        if (Sound.createAsync) {
          const { sound } = await Sound.createAsync(asset, { shouldPlay: true, isLooping: true, volume: 0.7 });
          soundRef.current = sound;
          return;
        }
      }

      // fallback to direct expo-av require if AudioRef wasn't set
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expoAv = require('expo-av');
        if (expoAv && expoAv.Audio && expoAv.Audio.Sound && expoAv.Audio.Sound.createAsync) {
          const { sound } = await expoAv.Audio.Sound.createAsync(asset, { shouldPlay: true, isLooping: true, volume: 0.7 });
          soundRef.current = sound;
          return;
        }
      } catch (e) {
        // ignore
      }

      // if still nothing, throw to indicate audio unavailable
      throw new Error('No audio available');
    } catch (e) {
      console.log('playMusic failed', e);
    }
  };

  const stopMusic = async () => {
    try {
      if (!soundRef.current) return;
      if (soundRef.current.stopAsync) await soundRef.current.stopAsync();
      if (soundRef.current.unloadAsync) await soundRef.current.unloadAsync();
      soundRef.current = null;
    } catch (e) {
      console.log('stopMusic failed', e);
      soundRef.current = null;
    }
  };

  const startTimer = () => {
    if (running) return;
    const startFrom = remaining > 0 ? remaining : durationSec;
    if (startFrom <= 0) return;
    setRemaining(startFrom);
    setRunning(true);
    // start music
    playMusic();
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // finish
          if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
          setRunning(false);
          stopMusic();
          Vibration.vibrate(800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const pauseTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
    setRunning(false);
    // pause music if possible
    try { if (soundRef.current && soundRef.current.pauseAsync) soundRef.current.pauseAsync(); } catch (e) {}
  };

  const resetTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
    setRunning(false);
    setRemaining(0);
    stopMusic();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
      stopMusic();
    };
  }, []);

  const verses = [
    { ref: 'Philippians 4:6', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Prayer Room</Text>
              <Text style={styles.subtitle}>A quiet place to pray</Text>
            </View>

            <View style={styles.centerArea}>
        <View style={styles.topBanner}>
          <Text style={styles.focusTitle}>Today's Focus</Text>
          <Text style={styles.focusText}>Be still and know that I am God. — Psalm 46:10</Text>
        </View>

        <Image
          source={require('../../assets/jesus-praying.png')}
          style={styles.prayerImage}
          accessibilityLabel="Jesus praying"
        />

        <View style={styles.versesContainer}>
          {verses.map((v) => (
            <View key={v.ref} style={styles.verseContainerSmall}>
              <Text style={styles.verseRef}>{v.ref}</Text>
              <Text style={styles.verseTextSmall}>{v.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.appointmentButton} onPress={startTimer} accessibilityLabel="Make appointment with God now">
          <Text style={styles.appointmentText}>Make appointment with God — Start now</Text>
        </TouchableOpacity>

        <Text style={styles.largeTime}>{formatTime(remaining > 0 ? remaining : durationSec)}</Text>

        <View style={styles.inputsRow}>
          <TextInput
            value={minutesInput}
            onChangeText={setMinutesInput}
            keyboardType="number-pad"
            style={styles.smallInput}
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={{ color: '#e5e7eb', marginHorizontal: 8, fontSize: 18 }}>:</Text>
          <TextInput
            value={secondsInput}
            onChangeText={setSecondsInput}
            keyboardType="number-pad"
            style={styles.smallInput}
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={startTimer} style={styles.controlButton}><Text style={styles.controlText}>{running ? 'Running' : 'Start'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={pauseTimer} style={styles.controlButton}><Text style={styles.controlText}>Pause</Text></TouchableOpacity>
          <TouchableOpacity onPress={resetTimer} style={[styles.controlButton, styles.resetButton]}><Text style={[styles.controlText, styles.resetText]}>Reset</Text></TouchableOpacity>
        </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  centerArea: {
  flex: 1,
  justifyContent: 'flex-start',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 28,
  },
  largeTime: {
    color: '#ffffff',
    fontSize: 72,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  smallInput: {
    width: 100,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#e5e7eb',
    textAlign: 'center',
    fontSize: 24,
    borderRadius: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  controlText: { color: '#fff', fontWeight: '700' },
  resetButton: { backgroundColor: '#ef4444' },
  resetText: { color: '#fff' },
  prayerImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  versesContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  verseContainerSmall: {
    marginBottom: 8,
  },
  verseRef: {
    color: '#6366f1',
    fontWeight: '700',
    marginBottom: 4,
  },
  verseTextSmall: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 22,
  },
  topBanner: {
    alignItems: 'center',
    marginBottom: 12,
  },
  focusTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  focusText: {
    color: '#c7c7d2',
    fontSize: 13,
    textAlign: 'center',
  },
  appointmentButton: {
    marginTop: 8,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
  },
  appointmentText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
});
