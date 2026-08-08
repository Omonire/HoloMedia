import { configureApi, configureStorage, configureSocket, type StorageAdapter } from '@holomedia/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const storage: StorageAdapter = {
  get: async (k) => AsyncStorage.getItem(k),
  set: async (k, v) => {
    await AsyncStorage.setItem(k, v);
  },
  remove: async (k) => {
    await AsyncStorage.removeItem(k);
  },
};

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return `${fromEnv.replace(/\/$/, '')}/api`;
  // Dev: backend runs on the same machine as the Metro bundler.
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { hostUri?: string }).hostUri;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

export function bootstrapShared(): void {
  configureStorage(storage);
  configureApi({ baseUrl: resolveBaseUrl() });
  configureSocket(resolveBaseUrl().replace(/\/api$/, ''));
}
