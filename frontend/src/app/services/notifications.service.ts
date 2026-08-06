import { Injectable, inject, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationItem } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(ApiService);

  unread = signal(0);
  private polling?: Subscription;

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
        next: (r) => this.unread.set(r.unread_count),
        error: () => {},
      });
  }
}
