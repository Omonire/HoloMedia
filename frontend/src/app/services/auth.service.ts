import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  user = signal<User | null>(null);
  loading = signal(true);

  get isLoggedIn(): boolean {
    return !!this.user() && !!localStorage.getItem('hm_token');
  }

  init(): void {
    if (!localStorage.getItem('hm_token')) {
      this.loading.set(false);
      return;
    }
    this.api.get<{ user: User }>('/auth/me').subscribe({
      next: (r) => this.user.set(r.user),
      error: () => this.clear(),
      complete: () => this.loading.set(false),
    });
  }

  login(username: string, password: string) {
    return this.api.post<{ token: string; user: User }>('/auth/login', { username, password })
      .pipe(tap((r) => this.persist(r)));
  }

  register(data: { username: string; email: string; full_name: string; password: string }) {
    return this.api.post<{ token: string; user: User }>('/auth/register', data)
      .pipe(tap((r) => this.persist(r)));
  }

  updateProfile(data: Partial<User> & { password?: string }) {
    return this.api.put<{ user: User }>('/auth/me', data).pipe(
      tap((r) => this.user.set(r.user))
    );
  }

  private persist(r: { token: string; user: User }): void {
    localStorage.setItem('hm_token', r.token);
    this.user.set(r.user);
  }

  whenReady(): Promise<User | null> {
    if (!this.loading()) return Promise.resolve(this.user());
    return new Promise((resolve) => {
      const sub = { unsub: () => {} };
      const check = () => {
        if (!this.loading()) {
          sub.unsub();
          resolve(this.user());
        }
      };
      check();
      const id = setInterval(check, 50);
      sub.unsub = () => clearInterval(id);
    });
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/welcome']);
  }

  private clear(): void {
    localStorage.removeItem('hm_token');
    this.user.set(null);
  }
}
