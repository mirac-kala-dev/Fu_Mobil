import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import HeaderBar from '../components/HeaderBar';

export default function InfoHubScreen() {
  const navigation = useNavigation();

  const rows = [
    {
      screen: 'AnnouncementsList',
      title: 'Duyurular',
      subtitle:
        'Mazeret sınavı, sınav programı, staj ve ders kayıt duyuruları — teknik.firat.edu.tr',
      icon: 'campaign',
    },
    {
      screen: 'AboutInstitution',
      title: 'Okulumuz',
      subtitle: 'Birimin tanımı ve resmi web sayfasına bağlantılar',
      icon: 'school',
    },
    {
      screen: 'ContactDetail',
      title: 'İletişim',
      subtitle: 'E-posta, telefon ve adres',
      icon: 'phone-in-talk',
    },
    {
      screen: 'ObsAccount',
      title: 'OBS / Hesabım',
      subtitle: 'Rol ve modül izinleri; içerik yönetimi (yetkiye bağlı)',
      icon: 'person-pin',
    },
    {
      screen: 'AdminPanel',
      title: 'İçerik yönetimi',
      subtitle: 'Giriş sonrası haber ekle/sil; isteğe bağlı bilgi çek',
      icon: 'tune',
    },
  ];

  return (
    <View style={styles.container}>
      <HeaderBar title="TB MYO Bilgi Merkezi" />

      <View style={styles.content}>
        {rows.map((row) => (
          <Pressable
            key={row.screen}
            onPress={() => navigation.navigate(row.screen)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name={row.icon} size={26} color="#8A1538" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{row.title}</Text>
              <Text style={styles.cardSub}>{row.subtitle}</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color="rgba(0,0,0,0.35)"
            />
          </Pressable>
        ))}

        <Text style={styles.hint}>
          Güncel resmi içerik her zaman{' '}
          <Text style={styles.hintBold}>teknik.firat.edu.tr</Text> üzerindedir.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(138, 21, 56, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.7,
    lineHeight: 17,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.58,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  hintBold: {
    fontWeight: '800',
    opacity: 0.9,
  },
});
