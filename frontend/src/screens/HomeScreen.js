import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import HeaderBar from '../components/HeaderBar';
import NewsCard from '../components/NewsCard';
import { API_BASE_URL } from '../config/api';

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_W - 32;

const CAMPUS = require('../../assets/campus.png');

const CAROUSEL_SLIDES = [
  { id: 'c1', source: CAMPUS },
  { id: 'c2', source: CAMPUS },
  { id: 'c3', source: CAMPUS },
];

const HOME_NEWS_LIMIT = 3;

/** Fırat Üniversitesi Teknik Bilimler MYO — Google Maps resmi konum */
const CAMPUS_LAT = 38.6866386;
const CAMPUS_LON = 39.1897344;
const MAP_PREVIEW_URL = `https://staticmap.openstreetmap.de/staticmap.php?center=${CAMPUS_LAT},${CAMPUS_LON}&zoom=15&size=640x280&markers=${CAMPUS_LAT},${CAMPUS_LON},red-pushpin`;
const MAP_OPEN_URL =
  'https://www.google.com/maps/place/F%C4%B1rat+%C3%9Cniversitesi+Teknik+Bilimler+MYO/@38.6866386,39.1897344,15z/data=!4m6!3m5!1s0x4076c052f77d2ea5:0xe04e737d699d2e31!8m2!3d38.6866386!4d39.1897344!16s%2Fg%2F11gdkppp9w?hl=tr';

const DEFAULT_ADDRESS =
  'Fırat Üniversitesi Teknik Bilimler MYO, Üniversite, 23119 Merkez/Elazığ';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const minWait = new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        setLoadError(false);
        const [newsRes, contactRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/news`),
          fetch(`${API_BASE_URL}/api/contact`),
        ]);
        if (!newsRes.ok) throw new Error(`HTTP ${newsRes.status}`);
        const data = await newsRes.json();
        let contactData = null;
        if (contactRes.ok) {
          contactData = await contactRes.json();
        }
        await minWait;
        if (!cancelled) {
          setNews(Array.isArray(data) ? data : []);
          setContact(contactData);
        }
      } catch (e) {
        console.warn('HomeScreen fetch /api/news:', e);
        await minWait;
        if (!cancelled) {
          setNews([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredNews = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? news.filter((n) => n.title.toLowerCase().includes(q)) : news;
    return list.slice(0, HOME_NEWS_LIMIT);
  }, [query, news]);

  const address = contact?.address || DEFAULT_ADDRESS;

  const listHeader = (
    <>
      <View style={styles.carouselBlock}>
        <FlatList
          style={{ width: SLIDE_WIDTH, alignSelf: 'center' }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={CAROUSEL_SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width: SLIDE_WIDTH }}>
              <ImageBackground
                source={item.source}
                style={styles.slideImage}
                imageStyle={styles.slideImageRadius}
              >
                <View style={styles.slideOverlay}>
                  <Text style={styles.slideCaption}>FÜ Kampüsüne Hoş Geldiniz</Text>
                </View>
              </ImageBackground>
            </View>
          )}
        />
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={22} color="#8A1538" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Haberlerde ara..."
          placeholderTextColor="rgba(51,51,51,0.45)"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.sectionTitle}>Birimden Haberler</Text>
      {!query.trim() && news.length > HOME_NEWS_LIMIT ? (
        <Text style={styles.sectionHint}>Son {HOME_NEWS_LIMIT} haber gösteriliyor</Text>
      ) : null}
    </>
  );

  const listFooter = (
    <View style={styles.locationBlock}>
      <View style={styles.locationHead}>
        <MaterialIcons name="place" size={22} color="#8A1538" />
        <Text style={styles.locationTitle}>Konum</Text>
      </View>
      <Text style={styles.locationAddress}>{address}</Text>
      <Pressable
        onPress={() => Linking.openURL(MAP_OPEN_URL)}
        style={({ pressed }) => [styles.mapPressable, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel="Haritada aç"
      >
        <Image source={{ uri: MAP_PREVIEW_URL }} style={styles.mapImage} resizeMode="cover" />
        <View style={styles.mapOverlay}>
          <MaterialIcons name="map" size={18} color="#FFFFFF" />
          <Text style={styles.mapOverlayText}>Haritada aç</Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderBar title="Teknik Bilimler MYO" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#8A1538" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNews}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={({ item }) => (
            <NewsCard
              title={item.title}
              date={item.date}
              imageUrl={item.image_url}
              onPress={() => navigation.navigate('NewsDetail', { id: item.id, title: item.title })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {loadError && !query.trim()
                  ? 'Bağlantı kurulamadı. api.js içindeki IP adresini (localhost / LAN) kontrol edin.'
                  : query.trim()
                    ? 'Aramanızla eşleşen haber yok.'
                    : 'Henüz haber yok.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 14,
  },
  carouselBlock: {
    marginBottom: 16,
  },
  slideImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  slideImageRadius: {
    borderRadius: 10,
  },
  slideOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  slideCaption: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.55,
    marginBottom: 10,
  },
  locationBlock: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  locationHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },
  mapPressable: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E8E8E8',
  },
  mapOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 21, 56, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: 24,
  },
  emptyText: {
    color: '#333333',
    opacity: 0.65,
    fontWeight: '600',
    textAlign: 'center',
  },
});
