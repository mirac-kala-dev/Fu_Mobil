import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config/api';

export default function AnnouncementsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements/highlights`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('AnnouncementsScreen:', e);
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A1538" />
        <Text style={styles.hint}>Duyurular yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.banner}>
          Veri alınamadı. Backend ve api.js bağlantısını kontrol edin.
        </Text>
      ) : null}

      <Text style={styles.lead}>
        Aşağıdaki başlıklar Teknik Bilimler MYO ana sayfasındaki duyuru kanalına bağlanır; tam metin ve
        ekleri siteden takip edin.
      </Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#8A1538"
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item.url)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.rowIcon}>
              <MaterialIcons name="notifications-active" size={22} color="#8A1538" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.title}>{item.title}</Text>
              {item.teaser ? <Text style={styles.teaser}>{item.teaser}</Text> : null}
              <Text style={styles.linkHint}>Teknik FIRAT üzerinde aç →</Text>
            </View>
            <MaterialIcons name="open-in-new" size={18} color="rgba(138,21,56,0.55)" />
          </Pressable>
        )}
        contentContainerStyle={styles.listPad}
        ListEmptyComponent={
          !error ? (
            <Text style={styles.empty}>Kayıtlı özet duyuru yok.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    paddingBottom: 40,
  },
  hint: {
    marginTop: 12,
    fontWeight: '600',
    color: '#333333',
  },
  banner: {
    backgroundColor: '#FFF3F3',
    color: '#8A1538',
    fontWeight: '700',
    fontSize: 13,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    lineHeight: 18,
  },
  lead: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.85,
    lineHeight: 19,
    marginBottom: 14,
  },
  listPad: {
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  rowIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333333',
    lineHeight: 21,
    marginBottom: 4,
  },
  teaser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.72,
    lineHeight: 17,
  },
  linkHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#8A1538',
    opacity: 0.85,
  },
  empty: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#333333',
    opacity: 0.55,
    paddingVertical: 24,
  },
});
