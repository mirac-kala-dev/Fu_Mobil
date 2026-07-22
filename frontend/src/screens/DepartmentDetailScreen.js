import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../config/api';

export default function DepartmentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name: initialName } = route.params ?? {};
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments/${id}`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();
      setDept(data);
    } catch (e) {
      console.warn('DepartmentDetailScreen:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const title = dept?.name ?? initialName ?? 'Bölüm';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={styles.backPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8A1538" />
        </View>
      ) : error || !dept ? (
        <View style={styles.center}>
          <Text style={styles.errText}>Bölüm bilgisi yüklenemedi.</Text>
          <Pressable style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name={dept.icon_name || 'business'}
                size={40}
                color="#8A1538"
              />
            </View>
            <Text style={styles.deptName}>{dept.name}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.body}>{dept.description || 'Açıklama yakında eklenecek.'}</Text>
          </View>

          {Array.isArray(dept.programs) && dept.programs.length ? (
            <View style={[styles.card, styles.programCard]}>
              <Text style={styles.programHdr}>Önlisans programları</Text>
              {dept.programs.map((p, idx) => (
                <View key={`${p}-${idx}`} style={styles.programRow}>
                  <MaterialIcons style={styles.programBullet} name="fiber-manual-record" size={8} color="#8A1538" />
                  <Text style={styles.programText}>{p}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.hint}>
            Güncel program ve duyurular için TB MYO resmi web sitesini ziyaret edin.
          </Text>
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
  },
  errText: {
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  retry: {
    backgroundColor: '#8A1538',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(138, 21, 56, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deptName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333333',
    fontWeight: '500',
  },
  programCard: {
    marginTop: 12,
  },
  programHdr: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 12,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 4,
  },
  programBullet: {
    marginTop: 6,
    marginRight: 10,
  },
  programText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: '#333333',
    opacity: 0.65,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
