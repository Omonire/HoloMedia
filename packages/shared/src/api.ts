import { storageAdapter, TOKEN_KEY } from './storage';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiConfig {
  baseUrl: string;
  onUnauthorized?: () => void;
}

let config: ApiConfig = { baseUrl: defaultBaseUrl() };

function defaultBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const local =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (local && window.location.port !== '5000') {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
}

export function configureApi(next: Partial<ApiConfig>): void {
  config = { ...config, ...next };
}

export function apiBaseUrl(): string {
  return config.baseUrl;
}

async function readToken(): Promise<string | null> {
  const value = await storageAdapter.get(TOKEN_KEY);
  return typeof value === 'string' && value ? value : null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = await authHeaders();
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${config.baseUrl}${path}`, init);

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string') message = data.error;
      else if (data && typeof data.message === 'string') message = data.message;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    if (res.status === 401) {
      await storageAdapter.remove(TOKEN_KEY);
      config.onUnauthorized?.();
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadVideo<T = { url: string }>(file: Blob): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = await authHeaders();
  const res = await fetch(`${config.baseUrl}/uploads/video`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      /* ignore */
    }
    if (res.status === 401) {
      await storageAdapter.remove(TOKEN_KEY);
      config.onUnauthorized?.();
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  uploadVideo,
};
