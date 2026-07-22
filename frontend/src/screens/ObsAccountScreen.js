import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import { PERMISSION_LABELS, ROLE_LABELS } from '../constants/obsPermissions';
import { useAuth } from '../context/AuthContext';

export default function ObsAccountScreen() {
  const navigation = useNavigation();
  const { user, login, logout, hasPermission, ready } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    if (!username.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Kullanıcı adı ve şifre girin.');
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
      setPassword('');
      Alert.alert('Giriş tamam', 'Rolünüze göre modül izinleri yüklendi.');
    } catch (e) {
      Alert.alert('Giriş hatası', e?.message || 'Bağlantıyı kontrol edin.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <HeaderBar title="OBS / Hesabım" />
        <View style={styles.centered}>
          <Text style={styles.muted}>Yükleniyor…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="OBS / Hesabım" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Bu bölüm, üniversite Öğrenci Bilgi Sistemi (OBS) tarzında rol ve modül izinlerini
          gösterir. Canlı akademik işlemler resmi{' '}
          <Text style={styles.leadBold}>obs.firat.edu.tr</Text> üzerindedir; burada yalnızca
          uygulama içi yetkilendirme örneği vardır.
        </Text>

        {!user ? (
          <>
            <Text style={styles.label}>Kullanıcı adı</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="örn. ogrenci_demo"
              style={styles.input}
              placeholderTextColor="rgba(51,51,51,0.45)"
            />
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Demo hesaplar: demo"
              style={styles.input}
              placeholderTextColor="rgba(51,51,51,0.45)"
            />
            <PrimaryButton
              title={busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
              subtitle="/api/auth/login"
              onPress={onLogin}
              large
              icon={<MaterialIcons name="login" size={24} color="#FFFFFF" />}
            />
            <Text style={styles.demoHint}>
              Demo: <Text style={styles.mono}>ogrenci_demo</Text>,{' '}
              <Text style={styles.mono}>ogretim_demo</Text>,{' '}
              <Text style={styles.mono}>personel_demo</Text>,{' '}
              <Text style={styles.mono}>sistem_demo</Text> — şifre hepsi{' '}
              <Text style={styles.mono}>demo</Text>
            </Text>
          </>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={32} color="#8A1538" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.display_name}</Text>
                <Text style={styles.profileMeta}>
                  @{user.username} · {ROLE_LABELS[user.role] || user.role}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Yetkili olduğunuz modüller</Text>
            {(user.permissions || []).map((key) => (
              <View key={key} style={styles.permRow}>
                <MaterialIcons name="check-circle" size={22} color="#2E7D32" />
                <Text style={styles.permText}>{PERMISSION_LABELS[key] || key}</Text>
              </View>
            ))}

            {hasPermission('icerik_yonetimi') ? (
              <Pressable
                onPress={() => navigation.navigate('AdminPanel')}
                style={({ pressed }) => [styles.adminLink, pressed && { opacity: 0.92 }]}
              >
                <MaterialIcons name="admin-panel-settings" size={22} color="#FFFFFF" />
                <Text style={styles.adminLinkText}>İçerik yönetimi paneli</Text>
                <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
              </Pressable>
            ) : null}

            <PrimaryButton
              title="Çıkış yap"
              subtitle="Oturumu bu cihazda sonlandır"
              onPress={() => {
                Alert.alert('Çıkış', 'Oturumu kapatmak istiyor musunuz?', [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Çıkış',
                    style: 'destructive',
                    onPress: () => logout(),
                  },
                ]);
              }}
              large
              icon={<MaterialIcons name="logout" size={24} color="#FFFFFF" />}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  lead: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#333',
    opacity: 0.88,
    marginBottom: 16,
  },
  leadBold: {
    fontWeight: '800',
    opacity: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(138,21,56,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
  },
  demoHint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(138,21,56,0.12)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(138, 21, 56, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#222',
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
    marginBottom: 10,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingVertical: 4,
  },
  permText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 19,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A1538',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 16,
    gap: 10,
  },
  adminLinkText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
