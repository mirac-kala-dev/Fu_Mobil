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

import PrimaryButton from '../components/PrimaryButton';
import { API_BASE_URL } from '../config/api';

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default function ContactScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [row, setRow] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();
      setRow(data);
    } catch (e) {
      console.warn('ContactScreen:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A1538" />
        <Text style={styles.hint}>İletişim bilgileri yükleniyor…</Text>
      </View>
    );
  }

  const email = row?.email ?? 'tbmyo@firat.edu.tr';
  const phone = row?.phone ?? '90 (424) 237 00 00';
  const address =
    row?.address ??
    'Fırat Üniversitesi Teknik Bilimler MYO, Üniversite, 23119 Merkez/Elazığ';

  const telHref = digitsOnly(phone).length >= 10 ? `tel:${digitsOnly(phone)}` : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
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
    >
      {error ? (
        <Text style={styles.banner}>API’ye ulaşılamadı. Aşağıdaki örnek bilgiler resmi iletişimdir.</Text>
      ) : null}

      <Text style={styles.lead}>
        {row?.lead_text ||
          'Teknik Bilimler MYO ile yazışma ve arama seçenekleri aşağıdadır. Güncel bilgi için resmi web sitesini de kullanabilirsiniz.'}
      </Text>

      <PrimaryButton
        title="E-posta gönder"
        subtitle={email}
        large
        icon={<MaterialIcons name="email" size={26} color="#FFFFFF" />}
        onPress={() => Linking.openURL(`mailto:${email}`)}
      />

      <PrimaryButton
        title="Telefon ara"
        subtitle={phone}
        large
        icon={<MaterialIcons name="phone" size={26} color="#FFFFFF" />}
        onPress={() => {
          if (telHref) Linking.openURL(telHref);
        }}
      />

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <MaterialIcons name="place" size={22} color="#8A1538" style={styles.cardHeadIcon} />
          <Text style={styles.cardTitle}>Adres</Text>
        </View>
        <Text style={styles.address}>{address}</Text>
      </View>

      <PrimaryButton
        title="Teknik FIRAT ana sayfası"
        subtitle="Harita ve diğer kurumsal bilgiler"
        large
        icon={<MaterialIcons name="language" size={26} color="#FFFFFF" />}
        onPress={() => Linking.openURL('https://teknik.firat.edu.tr/tr')}
      />

      {row?.footer_text ? (
        <Text style={styles.footer}>{row.footer_text}</Text>
      ) : null}
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
    paddingBottom: 36,
    paddingTop: 14,
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
    marginBottom: 14,
    lineHeight: 18,
  },
  lead: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 21,
    opacity: 0.9,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeadIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 22,
  },
  footer: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
    opacity: 0.65,
    lineHeight: 17,
  },
});
