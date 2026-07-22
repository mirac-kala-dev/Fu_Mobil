import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Varsayılan: Android emülatör → bilgisayardaki backend (10.0.2.2).
 * iOS simülatör / web → localhost.
 *
 * Gerçek telefonda aynı Wi‑Fi’deki bilgisayara bağlanmak için aşağıdaki satırı
 * kendi IPv4 adresinizle değiştirin (örn. http://192.168.1.105:3000).
 * Windows: `ipconfig` ile IPv4.
 */
function defaultBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri || '';
  const hostFromExpo = hostUri.split(':')[0];
  if (hostFromExpo) {
    return `http://${hostFromExpo}:3000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/**
 * Öncelik sırası:
 * 1) EXPO_PUBLIC_API_BASE_URL (.env)
 * 2) OVERRIDE (dosya içi hızlı test)
 * 3) platform default
 */
const ENV_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
/** İsterseniz doğrudan buraya LAN IP yazın; boş bırakınca defaultBaseUrl kullanılır. */
const OVERRIDE = '';

export const API_BASE_URL = ENV_BASE_URL || OVERRIDE.trim() || defaultBaseUrl();
