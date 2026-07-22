import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

const STORAGE_KEY = '@fukampus_obs_jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(async () => {
    setTokenState(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const applySession = useCallback(async (newToken, newUser) => {
    setTokenState(newToken);
    setUser(newUser);
    if (newToken) {
      await AsyncStorage.setItem(STORAGE_KEY, newToken);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshMe = useCallback(async (t) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    setUser(data.user);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          if (!cancelled) setReady(true);
          return;
        }
        const ok = await refreshMe(stored);
        if (cancelled) return;
        if (ok) {
          setTokenState(stored);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (username, password) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(username || '').trim(),
          password: String(password || ''),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || 'Giriş başarısız.';
        throw new Error(msg);
      }
      await applySession(data.token, data.user);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const hasPermission = useCallback(
    (perm) => Boolean(user?.permissions?.includes(perm)),
    [user]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login,
      logout,
      hasPermission,
    }),
    [token, user, ready, login, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir.');
  }
  return ctx;
}
