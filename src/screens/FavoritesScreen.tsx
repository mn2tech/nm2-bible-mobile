import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type FeedEntry = { title: string; published?: string | null; summary?: string; link?: string };

export default function DailyDevotionalScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const feedUrl = 'https://odb.org/feed/';

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      // lazy require parser to avoid bundler-time node imports
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { XMLParser } = require('fast-xml-parser');

      let res = await fetch(feedUrl);
      if (!res.ok) {
        // retry with a browser-like UA
        try { res = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }); } catch (e) {}
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const json = parser.parse(xml as any);
      const items = json.rss?.channel?.item || json.feed?.entry || [];
      const arr = Array.isArray(items) ? items : [items];

      const parsed = arr.map((it: any) => {
        const title = (it.title && (typeof it.title === 'string' ? it.title : it.title._text || it.title['#text'])) || '';

        let link: string | undefined;
        if (it.link) {
          if (typeof it.link === 'string') link = it.link;
          else if (Array.isArray(it.link) && it.link.length) link = it.link[0]?.['@_href'] || it.link[0]?.href || it.link[0]?._text;
          else link = it.link._text || it.link['#text'] || it.link['@_href'] || it.link.href;
        }

        const summary = (it.description?._text || it.description || it.summary?._text || it.summary || it['content:encoded'] || it.content) || '';
        const pubRaw = it.pubDate?._text || it.pubDate || it.published?._text || it.published || it.updated?._text || it.updated || null;

        return { title: String(title).trim(), published: pubRaw ? String(pubRaw) : null, summary: String(summary || '').trim(), link } as FeedEntry;
      }).filter((x: any) => x.title || x.summary);

      setEntries(parsed.slice(0, 3));
    } catch (err: any) {
      setError('Unable to fetch devotionals. Please try again later.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  const cleanHtml = (s?: string) => (s ? String(s).replace(/<[^>]+>/g, '').trim() : '');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>Daily Devotional (Our Daily Bread)</Text>
        <TouchableOpacity onPress={() => fetchFeed()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading && <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />}
        {!loading && error && <Text style={{ color: '#ef4444', marginTop: 12 }}>{error}</Text>}

        {!loading && !error && entries.length === 0 && (
          <Text style={{ color: '#6b7280', marginTop: 12 }}>No devotionals found.</Text>
        )}

        {entries.map((e, i) => (
          <View key={i} style={styles.card}>
            {e.published ? (() => { try { const d = new Date(e.published as string); if (!isNaN(d.getTime())) return <Text style={styles.pub}>{d.toDateString()}</Text>; } catch (ex) {} return <Text style={styles.pub}>{e.published}</Text>; })() : null}
            <Text style={styles.passage}>{e.title}</Text>
            {e.summary ? <Text style={styles.ref}>{cleanHtml(e.summary)}</Text> : null}
            {e.link ? <TouchableOpacity onPress={() => { try { Linking.openURL(e.link!); } catch {} }}><Text style={styles.link}>Read more</Text></TouchableOpacity> : null}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },
  card: { backgroundColor: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 20 },
  pub: { color: '#666', fontSize: 12, marginBottom: 8 },
  passage: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  ref: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 8 },
  link: { color: '#2563eb', marginTop: 8 }
});
