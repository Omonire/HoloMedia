import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotificationsService } from '../services/notifications.service';
import { NotificationItem } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';

@Component({
  selector: 'app-notifications',
  imports: [RouterLink, AvatarComponent, TimeAgoPipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  private api = inject(ApiService);
  private notes = inject(NotificationsService);

  items: NotificationItem[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.get<{ notifications: NotificationItem[]; unread_count: number }>('/notifications/')
      .subscribe({
        next: (r) => {
          this.items = r.notifications;
          this.notes.unread.set(0);
          this.loading = false;
          if (r.notifications.some((n) => !n.read)) this.markRead();
        },
        error: () => (this.loading = false),
      });
  }

  markRead(): void {
    this.api.post('/notifications/read').subscribe({
      next: () => (this.items = this.items.map((n) => ({ ...n, read: true }))),
      error: () => {},
    });
  }

  text(n: NotificationItem): string {
    const who = `@${n.actor.username}`;
    switch (n.kind) {
      case 'follow': return `${who} started following you`;
      case 'like': return `${who} liked your post`;
      case 'comment': return `${who} commented on your post`;
      case 'message': return `${who} sent you a message`;
      case 'repost': return `${who} reposted your post`;
      case 'group': return `${who} joined your group`;
      default: return `${who} interacted with you`;
    }
  }
}
