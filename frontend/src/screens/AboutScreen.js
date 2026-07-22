import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import PrimaryButton from '../components/PrimaryButton';
import { API_BASE_URL } from '../config/api';

export default function AboutScreen() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/about`);
        if (!res.ok) throw new Error('HTTP');
        const data = await res.json();
        if (!cancel) setPayload(data);
      } catch (e) {
        console.warn('AboutScreen:', e);
        if (!cancel) setError(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!payload && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A1538" />
      </View>
    );
  }

  const sections = payload?.sections ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {error || !payload ? (
        <Text style={styles.err}>
          Bilgi metni yüklenemedi. Backend’in çalıştığından emin olun veya doğrudan resmi siteyi ziyaret
          edin.
        </Text>
      ) : null}

      {payload ? (
        <>
          <Text style={styles.headline}>{payload.headline}</Text>
          <Text style={styles.uni}>{payload.university}</Text>
          <Text style={styles.intro}>{payload.intro}</Text>

          <View style={styles.sourceRow}>
            <MaterialIcons name="public" size={18} color="#8A1538" style={styles.sourceIcon} />
            <Text style={styles.sourceLabel}>{payload.source_label}</Text>
          </View>
          <PrimaryButton
            title={payload.source_url.replace(/^https?:\/\//, '')}
            subtitle="Teknik Bilimler MYO resmi adresi — detay için siteyi açın"
            large
            icon={<MaterialIcons name="language" size={26} color="#FFFFFF" />}
            onPress={() => Linking.openURL(payload.source_url)}
          />

          <Text style={styles.sectionHdr}>Önemli bağlantılar</Text>
          {sections.map((s, idx) => (
            <PrimaryButton
              key={`${s.title}-${idx}`}
              title={s.title}
              subtitle={s.description}
              large
              icon={<MaterialIcons name="open-in-new" size={24} color="#FFFFFF" />}
              onPress={() => Linking.openURL(s.url)}
            />
          ))}
        </>
      ) : (
        <PrimaryButton
          title="teknik.firat.edu.tr"
          subtitle="Teknik Bilimler MYO — resmi site"
          large
          icon={<MaterialIcons name="language" size={26} color="#FFFFFF" />}
          onPress={() => Linking.openURL('https://teknik.firat.edu.tr/tr')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    paddingTop: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  headline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333333',
    marginBottom: 4,
  },
  uni: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A1538',
    marginBottom: 14,
  },
  intro: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 22,
    opacity: 0.9,
    marginBottom: 20,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceIcon: {
    marginRight: 6,
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333333',
  },
  sectionHdr: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333333',
    marginTop: 10,
    marginBottom: 12,
  },
  err: {
    backgroundColor: '#FFF3F3',
    color: '#8A1538',
    fontWeight: '700',
    fontSize: 13,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 18,
  },
});
