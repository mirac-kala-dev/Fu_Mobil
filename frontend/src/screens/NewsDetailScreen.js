import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../config/api';

export default function NewsDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, title: initialTitle } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news/${id}`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.warn('NewsDetailScreen:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const title = news?.title ?? initialTitle ?? 'Haber';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle} numberOfLines={2}>
            Birimden Haberler
          </Text>
        </View>
        <View style={styles.backPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8A1538" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : error || !news ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#8A1538" style={{ opacity: 0.5 }} />
          <Text style={styles.errText}>Haber yüklenemedi.</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {news.image_url ? (
            <Image
              source={{ uri: news.image_url }}
              style={styles.hero}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={14} color="#8A1538" />
            <Text style={styles.dateText}>{news.date}</Text>
          </View>

          <Text style={styles.headline}>{title}</Text>

          <View style={styles.divider} />

          <Text style={styles.body}>{news.content || 'İçerik yakında eklenecek.'}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A1538',
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  backPlaceholder: {
    width: 40,
  },
  topBarTitleWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  errText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#8A1538',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  scroll: {
    paddingBottom: 40,
  },
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(138, 21, 56, 0.08)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A1538',
  },
  headline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a1a',
    lineHeight: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  divider: {
    height: 2,
    backgroundColor: '#8A1538',
    opacity: 0.15,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 2,
  },
  body: {
    fontSize: 15,
    lineHeight: 26,
    color: '#333333',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
});
