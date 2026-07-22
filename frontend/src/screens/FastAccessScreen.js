import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import { API_BASE_URL } from '../config/api';

export default function FastAccessScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [links, setLinks] = useState([]);
  const [contact, setContact] = useState({
    lead_text: '',
    footer_text: '',
  });
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [lr, cr] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quick-links`),
        fetch(`${API_BASE_URL}/api/contact`),
      ]);
      if (!lr.ok || !cr.ok) throw new Error('HTTP');
      const linkData = await lr.json();
      const contactData = await cr.json();
      setLinks(Array.isArray(linkData) ? linkData : []);
      setContact({
        lead_text: contactData.lead_text ?? '',
        footer_text: contactData.footer_text ?? '',
      });
    } catch (e) {
      console.warn('FastAccessScreen load:', e);
      setError(true);
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

  return (
    <View style={styles.container}>
      <HeaderBar title="Hızlı Erişim" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8A1538" />
          <Text style={styles.hint}>Bağlantı kuruluyor…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A1538" />
          }
        >
          {error ? (
            <Text style={styles.errBanner}>
              Veri alınamadı. Backend çalışıyor mu ve api.js adresi doğru mu kontrol edin.
            </Text>
          ) : null}

          <Text style={styles.lead}>
            {contact.lead_text || 'Sık kullanılan kurumsal bağlantılar'}
          </Text>

          {links.map((item) => (
            <PrimaryButton
              key={item.id}
              large
              title={item.title}
              subtitle={item.subtitle}
              icon={
                <MaterialIcons
                  name={item.icon_name || 'link'}
                  size={26}
                  color="#FFFFFF"
                />
              }
              onPress={() => Linking.openURL(item.url)}
            />
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {contact.footer_text ||
                'İletişim: tbmyo@firat.edu.tr | Tel: 0 (424) 237 00 00'}
            </Text>
          </View>
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
  scrollContent: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  errBanner: {
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    color: '#8A1538',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  lead: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    opacity: 0.9,
    marginBottom: 18,
    lineHeight: 20,
  },
  footer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  footerText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
});
