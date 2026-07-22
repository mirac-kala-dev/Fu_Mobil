import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import HeaderBar from '../components/HeaderBar';
import { API_BASE_URL } from '../config/api';

export default function DepartmentsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('DepartmentsScreen load:', e);
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBar title="Akademik Birimlerimiz" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8A1538" />
          <Text style={styles.hint}>Bölümler yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="Akademik Birimlerimiz" />

      {error ? (
        <View style={styles.bannerWrap}>
          <Text style={styles.errBanner}>
            Bölüm listesi alınamadı. Backend ve api.js ayarını kontrol edin.
          </Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.columnWrap}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A1538" />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              onPress={() =>
                navigation.navigate('DepartmentDetail', {
                  id: item.id,
                  name: item.name,
                })
              }
            >
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name={item.icon_name || 'business'}
                  size={28}
                  color="#8A1538"
                />
              </View>
              <Text style={styles.cardText} numberOfLines={3}>
                {item.name}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Kayıtlı bölüm bulunamadı.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  hint: {
    marginTop: 12,
    color: '#333333',
    fontWeight: '600',
  },
  bannerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  errBanner: {
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: 12,
    color: '#8A1538',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrap: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(138, 21, 56, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardText: {
    color: '#333333',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#333333',
    opacity: 0.6,
    fontWeight: '600',
    paddingVertical: 24,
  },
});
