import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Conversation, User } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';
import { FormsModule } from '@angular/forms';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-messages',
  imports: [AvatarComponent, TimeAgoPipe, FormsModule, ShimmerComponent],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private auth = inject(AuthService);

  conversations: Conversation[] = [];
  loading = true;
  search = '';
  searchResults: User[] = [];

  ngOnInit(): void {
    this.api.get<{ conversations: Conversation[] }>('/messages/conversations').subscribe({
      next: (r) => {
        this.conversations = r.conversations;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  searchUsers(): void {
    const q = this.search.trim();
    if (!q) {
      this.searchResults = [];
      return;
    }
    this.api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`).subscribe({
      next: (r) => {
        const me = this.auth.user();
        this.searchResults = r.users
          .filter((u) => me && u.id !== me.id)
          .filter((u) => !this.conversations.some((c) => c.user.id === u.id));
      },
      error: () => (this.searchResults = []),
    });
  }

  openUser(u: User): void {
    this.router.navigate(['/messages', u.username]);
  }

  openConvo(c: Conversation): void {
    this.router.navigate(['/messages', c.user.username]);
  }
}
