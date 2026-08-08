import { api } from './api';
import { storageAdapter, TOKEN_KEY } from './storage';
import type { User } from './types';

export interface AuthResult {
  token: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

type Listener = () => void;

class AuthSession {
  private _user: User | null = null;
  private _ready = false;
  private listeners = new Set<Listener>();

  get user(): User | null {
    return this._user;
  }

  get ready(): boolean {
    return this._ready;
  }

  get isLoggedIn(): boolean {
    return !!this._user;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  setUser(user: User | null): void {
    this._user = user;
    this._ready = true;
    this.notify();
  }

  async init(): Promise<void> {
    const token = await storageAdapter.get(TOKEN_KEY);
    if (!token) {
      this._ready = true;
      this.notify();
      return;
    }
    try {
      const r = await api.get<{ user: User }>('/auth/me');
      this._user = r.user;
    } catch {
      this._user = null;
    }
    this._ready = true;
    this.notify();
  }

  async login(username: string, password: string): Promise<User> {
    const r = await api.post<AuthResult>('/auth/login', { username, password });
    await storageAdapter.set(TOKEN_KEY, r.token);
    this._user = r.user;
    this._ready = true;
    this.notify();
    return r.user;
  }

  async register(data: RegisterPayload): Promise<User> {
    const r = await api.post<AuthResult>('/auth/register', data);
    await storageAdapter.set(TOKEN_KEY, r.token);
    this._user = r.user;
    this._ready = true;
    this.notify();
    return r.user;
  }

  async updateProfile(data: Partial<User> & { password?: string }): Promise<User> {
    const r = await api.put<{ user: User }>('/auth/me', data);
    this._user = r.user;
    this.notify();
    return r.user;
  }

  async logout(): Promise<void> {
    await storageAdapter.remove(TOKEN_KEY);
    this._user = null;
    this._ready = true;
    this.notify();
  }
}

export const authSession = new AuthSession();
