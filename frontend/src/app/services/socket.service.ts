import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { NotificationsService } from './notifications.service';

const SOCKET_URL = 'http://localhost:5000';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private notes = inject(NotificationsService);

  private socket?: Socket;

  connect(): void {
    const token = localStorage.getItem('hm_token');
    if (!token) return;
    if (this.socket?.connected) return;
    if (this.socket) {
      this.socket.connect();
      return;
    }
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    this.socket.on('new_message', () => this.notes.refresh());
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    const listener = handler as unknown as (...args: unknown[]) => void;
    this.socket?.on(event, listener);
    return () => this.socket?.off(event, listener);
  }

  emit(event: string, data?: unknown): boolean {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  get connected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
