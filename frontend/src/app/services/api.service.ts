import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const isLocal = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_URL = isLocal && window.location.port !== '5000'
  ? 'http://localhost:5000/api'
  : '/api';

export class ApiError {
  constructor(public status: number, public message: string) {}
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private headers(): Record<string, string> {
    const token = localStorage.getItem('hm_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private handle(error: HttpErrorResponse): Observable<never> {
    const body = error.error;
    let message = 'Something went wrong. Please try again.';
    if (typeof body === 'string' && body) {
      message = body;
    } else if (body && typeof body.error === 'string') {
      message = body.error;
    } else if (body && typeof body.message === 'string') {
      message = body.message;
    }
    if (error.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('hm_token');
      location.href = '/login';
    }
    return throwError(() => new ApiError(error.status, message));
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${API_URL}${path}`, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${API_URL}${path}`, body ?? {}, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(`${API_URL}${path}`, body ?? {}, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${API_URL}${path}`, body ?? {}, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${API_URL}${path}`, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }

  uploadVideo<T>(file: File): Observable<T> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<T>(`${API_URL}/uploads/video`, form, { headers: this.headers() })
      .pipe(catchError((e) => this.handle(e)));
  }
}
