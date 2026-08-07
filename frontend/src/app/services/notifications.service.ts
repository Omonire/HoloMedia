import { Injectable, inject, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationItem } from '../models';
import type { FluxToast } from '../demo/ari/flux-toast-stack';

const KIND_MESSAGES: Record<string, { message: string; variant: 'info' | 'success' | 'warning' }> = {
  follow: { message: 'started following you', variant: 'info' },
  like: { message: 'liked your post', variant: 'success' },
  comment: { message: 'commented on your post', variant: 'info' },
  message: { message: 'sent you a message', variant: 'info' },
  repost: { message: 'reposted your post', variant: 'success' },
  group: { message: 'invited you to a group', variant: 'warning' },
};

function timeAgo(value: string): string {
  const then = new Date(value).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString();
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(ApiService);

  unread = signal(0);
  toasts = signal<FluxToast[]>([]);

  private polling?: Subscription;
  private seenIds = new Set<number>();
  private firstLoad = true;

  start(): void {
    if (this.polling) return;
    this.refresh();
    this.polling = interval(15000).subscribe(() => this.refresh());
  }

  stop(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;
    this.unread.set(0);
  }

  refresh(): void {
    this.api.get<{ notifications: NotificationItem[]; unread_count: number }>('/notifications/')
      .subscribe({
        next: (r) => {
          this.unread.set(r.unread_count);
          for (const n of r.notifications) {
            if (this.seenIds.has(n.id)) continue;
            this.seenIds.add(n.id);
            if (this.firstLoad) continue;
            this.pushToast(n);
          }
          this.firstLoad = false;
        },
        error: () => {},
      });
  }

  dismissToast(id: string): void {
    this.toasts.update((prev) => prev.filter((t) => t.id !== id));
  }

  private pushToast(n: NotificationItem): void {
    const kind = KIND_MESSAGES[n.kind] ?? KIND_MESSAGES['like'];
    const toast: FluxToast = {
      id: `notif-${n.id}`,
      title: n.actor.full_name,
      message: kind.message,
      time: timeAgo(n.created_at),
      variant: kind.variant,
    };
    this.toasts.update((prev) => [toast, ...prev].slice(0, 5));
  }
}
