import { io, type Socket } from 'socket.io-client';
import { storageAdapter, TOKEN_KEY } from './storage';

function defaultSocketUrl(): string {
  if (typeof window !== 'undefined') {
    const local =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (local) return 'http://localhost:5000';
    return window.location.origin;
  }
  return '';
}

let socketUrl = defaultSocketUrl();
let socket: Socket | null = null;
let connecting = false;

export function configureSocket(url: string): void {
  socketUrl = url;
}

export function connectSocket(): Socket | null {
  if (socket) return socket;
  if (connecting) return null;

  connecting = true;
  void (async () => {
    try {
      const token = await storageAdapter.get(TOKEN_KEY);
      if (!token) return;
      if (!socket) {
        socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
        });
      }
    } finally {
      connecting = false;
    }
  })();

  return socket;
}

export function onSocket<T>(event: string, handler: (data: T) => void): () => void {
  const listener = handler as unknown as (...args: unknown[]) => void;
  socket?.on(event, listener);
  return () => socket?.off(event, listener);
}

export function emitSocket(event: string, data?: unknown): boolean {
  if (socket?.connected) {
    socket.emit(event, data);
    return true;
  }
  return false;
}

export function socketConnected(): boolean {
  return !!socket?.connected;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
