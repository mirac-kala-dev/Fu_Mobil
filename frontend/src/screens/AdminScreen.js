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

import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import { API_BASE_URL } from '../config/api';

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nextNewsId(rows) {
  const nums = rows
    .map((r) => Number(r.id))
    .filter((n) => Number.isFinite(n) && n > 0);
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

export default function AdminScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);

  const [newsJson, setNewsJson] = useState('[]');
  const [linksJson, setLinksJson] = useState('[]');
  const [annJson, setAnnJson] = useState('[]');
  const [contactJson, setContactJson] = useState('{}');

  function parseNews() {
    try {
      const rows = JSON.parse(newsJson);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return null;
    }
  }

  async function loadBootstrapWithToken(t) {
    const bootstrapRes = await fetch(`${API_BASE_URL}/api/admin/bootstrap`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!bootstrapRes.ok) throw new Error('BOOTSTRAP_FAILED');
    const data = await bootstrapRes.json();
    setNewsJson(pretty(data.news || []));
    setLinksJson(pretty(data.quick_links || []));
    setAnnJson(pretty(data.announcements || []));
    setContactJson(pretty(data.contact || {}));
  }

  async function panelLogin() {
    const user = username.trim().toLowerCase();
    const pass = password;
    if (!pass) {
      Alert.alert('Eksik bilgi', 'Şifre girin.');
      return;
    }

    setLoading(true);
    try {
      if (!user || user === 'admin') {
        const loginRes = await fetch(`${API_BASE_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass }),
        });
        if (!loginRes.ok) throw new Error('LOGIN_FAILED');
        const { token: t } = await loginRes.json();
        setApiToken(t);
        setSessionLabel('Admin');
        setPanelOpen(true);
        setPassword('');
        Alert.alert('Giriş tamam', 'İçerik yönetim paneline hoş geldiniz.');
        return;
      }

      const obsRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const obsData = await obsRes.json().catch(() => ({}));
      if (!obsRes.ok) {
        throw new Error(obsData.message || 'LOGIN_FAILED');
      }
      const perms = obsData.user?.permissions || [];
      if (!perms.includes('icerik_yonetimi')) {
        Alert.alert(
          'Yetki yok',
          'Bu hesapta içerik yönetimi izni bulunmuyor. Sistem yöneticisi hesabı veya admin girişi kullanın.'
        );
        return;
      }
      setApiToken(obsData.token);
      setSessionLabel(obsData.user?.display_name || obsData.user?.username || user);
      setPanelOpen(true);
      setPassword('');
      Alert.alert('Giriş tamam', 'İçerik yönetim paneline hoş geldiniz.');
    } catch (e) {
      Alert.alert(
        'Giriş hatası',
        e?.message === 'LOGIN_FAILED' || !e?.message
          ? 'Kullanıcı adı veya şifre hatalı. Admin için kullanıcı adı boş veya "admin", şifre ADMIN_PASSWORD.'
          : e.message
      );
    } finally {
      setLoading(false);
    }
  }

  function panelLogout() {
    setPanelOpen(false);
    setApiToken('');
    setSessionLabel('');
    setUsername('');
    setPassword('');
    setNewsJson('[]');
    setLinksJson('[]');
    setAnnJson('[]');
    setContactJson('{}');
  }

  async function fetchBootstrap() {
    if (!apiToken) {
      Alert.alert('Hata', 'Önce giriş yapın.');
      return;
    }
    setLoading(true);
    try {
      await loadBootstrapWithToken(apiToken);
      Alert.alert('Başarılı', 'Sunucudaki güncel veriler yüklendi.');
    } catch {
      Alert.alert('Hata', 'Veriler alınamadı. Backend bağlantısını kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  function addNews() {
    const rows = parseNews();
    if (rows === null) {
      Alert.alert('Hata', 'Haber JSON formatı geçersiz. Önce düzeltin veya Bilgi çek ile yenileyin.');
      return;
    }
    const item = {
      id: nextNewsId(rows),
      title: 'Yeni haber başlığı',
      date: todayIso(),
      image_url: 'https://picsum.photos/seed/yenihaber/800/450',
    };
    setNewsJson(pretty([item, ...rows]));
    Alert.alert('Eklendi', 'Yeni haber listenin başına eklendi. Başlık ve tarihi düzenleyip kaydedin.');
  }

  function removeNews() {
    const rows = parseNews();
    if (rows === null) {
      Alert.alert('Hata', 'Haber JSON formatı geçersiz.');
      return;
    }
    if (!rows.length) {
      Alert.alert('Bilgi', 'Silinecek haber yok.');
      return;
    }

    const buttons = rows.slice(0, 8).map((row, index) => ({
      text: `${row.title || 'Başlıksız'}`.slice(0, 42),
      onPress: () => {
        const next = rows.filter((_, i) => i !== index);
        setNewsJson(pretty(next));
        Alert.alert('Silindi', 'Haber listeden kaldırıldı. Kaydetmeyi unutmayın.');
      },
    }));

    buttons.push({ text: 'Vazgeç', style: 'cancel' });
    Alert.alert('Haber sil', 'Kaldırmak istediğiniz haberi seçin:', buttons);
  }

  async function saveAll() {
    if (!apiToken) {
      Alert.alert('Hata', 'Önce giriş yapın.');
      return;
    }
    setLoading(true);
    try {
      const newsRows = JSON.parse(newsJson);
      const linkRows = JSON.parse(linksJson);
      const annRows = JSON.parse(annJson);
      const contact = JSON.parse(contactJson);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      };

      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/news`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ rows: newsRows }),
        }),
        fetch(`${API_BASE_URL}/api/admin/quick-links`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ rows: linkRows }),
        }),
        fetch(`${API_BASE_URL}/api/admin/announcements`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ rows: annRows }),
        }),
        fetch(`${API_BASE_URL}/api/admin/contact`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(contact),
        }),
      ]);

      if (responses.some((r) => !r.ok)) {
        throw new Error('SAVE_FAILED');
      }

      Alert.alert('Başarılı', 'Tüm içerikler kaydedildi.');
    } catch {
      Alert.alert(
        'Hata',
        'Kayıt sırasında hata oldu. JSON formatı ve zorunlu alanları kontrol edin.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!panelOpen) {
    return (
      <View style={styles.container}>
        <HeaderBar title="İçerik yönetimi" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lead}>
            Panele girmek için kullanıcı adı ve şifre girin. Admin girişinde kullanıcı adını boş
            bırakabilir veya <Text style={styles.leadEm}>admin</Text> yazabilirsiniz. OBS hesabı
            için <Text style={styles.leadEm}>içerik yönetimi</Text> yetkisi gerekir.
          </Text>

          <Text style={styles.label}>Kullanıcı adı</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder='Admin: boş veya "admin" — OBS: örn. sistem_demo'
            style={styles.input}
            placeholderTextColor="rgba(51,51,51,0.45)"
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Şifrenizi girin"
            style={styles.input}
            placeholderTextColor="rgba(51,51,51,0.45)"
          />

          <PrimaryButton
            title={loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            subtitle="Panel açılmadan önce kimlik doğrulama"
            onPress={panelLogin}
            large
            icon={<MaterialIcons name="lock" size={24} color="#FFFFFF" />}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="İçerik yönetimi" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <MaterialIcons name="verified-user" size={22} color="#2E7D32" />
          <Text style={styles.bannerText}>
            Oturum: {sessionLabel}. Veriler otomatik yüklenmez; isterseniz alttan Bilgi çek
            kullanın.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={addNews}
            style={({ pressed }) => [styles.actionBtn, styles.actionAdd, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Haber ekle</Text>
          </Pressable>
          <Pressable
            onPress={removeNews}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionRemove,
              pressed && { opacity: 0.9 },
            ]}
          >
            <MaterialIcons name="remove-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Haber sil</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Haberler JSON</Text>
        <TextInput
          value={newsJson}
          onChangeText={setNewsJson}
          style={styles.textarea}
          multiline
          autoCapitalize="none"
        />

        <Text style={styles.section}>Hızlı erişim JSON</Text>
        <TextInput
          value={linksJson}
          onChangeText={setLinksJson}
          style={styles.textarea}
          multiline
          autoCapitalize="none"
        />

        <Text style={styles.section}>Duyuru özet JSON</Text>
        <TextInput
          value={annJson}
          onChangeText={setAnnJson}
          style={styles.textarea}
          multiline
          autoCapitalize="none"
        />

        <Text style={styles.section}>İletişim JSON</Text>
        <TextInput
          value={contactJson}
          onChangeText={setContactJson}
          style={styles.textarea}
          multiline
          autoCapitalize="none"
        />

        <PrimaryButton
          title={loading ? 'Kaydediliyor...' : 'Tümünü kaydet'}
          subtitle="Haberler, hızlı erişim, duyurular ve iletişim"
          onPress={saveAll}
          large
          icon={<MaterialIcons name="save" size={24} color="#FFFFFF" />}
        />

        <PrimaryButton
          title={loading ? 'Yükleniyor...' : 'Bilgi çek'}
          subtitle="Sunucudaki güncel içeriği JSON alanlarına getir"
          onPress={fetchBootstrap}
          large
          icon={<MaterialIcons name="cloud-download" size={24} color="#FFFFFF" />}
        />

        <Pressable onPress={panelLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıkış yap</Text>
        </Pressable>
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
    paddingBottom: 30,
  },
  lead: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.9,
    marginBottom: 14,
  },
  leadEm: {
    fontWeight: '900',
    color: '#8A1538',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.25)',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
    lineHeight: 17,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333333',
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
    color: '#333333',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionAdd: {
    backgroundColor: '#2E7D32',
  },
  actionRemove: {
    backgroundColor: '#C62828',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    fontSize: 13,
    fontWeight: '900',
    color: '#333333',
    marginTop: 8,
    marginBottom: 6,
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(138,21,56,0.2)',
    minHeight: 140,
    textAlignVertical: 'top',
    padding: 10,
    marginBottom: 10,
    color: '#222222',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A1538',
  },
});
