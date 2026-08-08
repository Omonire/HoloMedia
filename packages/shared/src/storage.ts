/**
 * Framework-agnostic storage adapter so the same session code works on the
 * web (localStorage) and on React Native (AsyncStorage).
 */
export interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

let storage: StorageAdapter = {
  get: (k) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(k);
  },
  set: (k, v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  remove: (k) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

export function configureStorage(adapter: StorageAdapter): void {
  storage = adapter;
}

export const storageAdapter: StorageAdapter = storage;

export const TOKEN_KEY = 'hm_token';
