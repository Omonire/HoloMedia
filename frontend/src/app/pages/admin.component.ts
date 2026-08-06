import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AvatarComponent } from '../shared/avatar.component';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_color: string;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
  post_count: number;
  followers_count: number;
}

interface AdminPost {
  id: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  sound: string | null;
  created_at: string;
  author: AdminUser;
  likes_count: number;
  comments_count: number;
}

interface AdminComment {
  id: number;
  content: string;
  post_id: number;
  created_at: string;
  author: AdminUser;
}

interface AdminGroup {
  id: number;
  name: string;
  description: string;
  icon_color: string;
  created_at: string;
  members_count: number;
  posts_count: number;
  creator: AdminUser;
}

@Component({
  selector: 'app-admin',
  imports: [FormsModule, AvatarComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);

  tab = signal<'dashboard' | 'users' | 'posts' | 'comments' | 'groups' | 'settings'>('dashboard');
  error = '';

  stats = signal<Record<string, number> | null>(null);
  users = signal<AdminUser[]>([]);
  posts = signal<AdminPost[]>([]);
  comments = signal<AdminComment[]>([]);
  groups = signal<AdminGroup[]>([]);
  settings = signal<Record<string, string> | null>(null);

  userQ = '';
  postQ = '';
  commentQ = '';
  loading = false;

  statItems = signal<{ key: string; label: string }[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadGroups();
    this.loadSettings();
  }

  setTab(t: 'dashboard' | 'users' | 'posts' | 'comments' | 'groups' | 'settings'): void {
    this.tab.set(t);
    this.error = '';
  }

  loadStats(): void {
    this.api.get<{ stats: Record<string, number> }>('/admin/stats').subscribe({
      next: (r) => {
        this.stats.set(r.stats);
        this.statItems.set([
          { key: 'users', label: 'Users' },
          { key: 'posts', label: 'Posts' },
          { key: 'reels', label: 'Reels' },
          { key: 'groups', label: 'Groups' },
          { key: 'comments', label: 'Comments' },
          { key: 'messages', label: 'Messages' },
          { key: 'likes', label: 'Likes' },
          { key: 'uploads', label: 'Uploads' },
          { key: 'admins', label: 'Admins' },
          { key: 'suspended_users', label: 'Suspended' },
        ]);
      },
      error: (e) => (this.error = e.message),
    });
  }

  loadUsers(q = ''): void {
    this.loading = true;
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    this.api.get<{ users: AdminUser[] }>(`/admin/users${query}`).subscribe({
      next: (r) => this.users.set(r.users),
      error: (e) => (this.error = e.message),
      complete: () => (this.loading = false),
    });
  }

  onUserSearch(): void {
    this.loadUsers(this.userQ);
  }

  toggleAdmin(u: AdminUser): void {
    this.api.patch<{ user: AdminUser }>(`/admin/users/${u.id}`, { is_admin: !u.is_admin })
      .subscribe({
        next: () => this.loadUsers(this.userQ),
        error: (e) => (this.error = e.message),
      });
  }

  toggleSuspend(u: AdminUser): void {
    this.api.patch<{ user: AdminUser }>(`/admin/users/${u.id}`, { is_suspended: !u.is_suspended })
      .subscribe({
        next: () => this.loadUsers(this.userQ),
        error: (e) => (this.error = e.message),
      });
  }

  deleteUser(u: AdminUser): void {
    if (!confirm(`Delete @${u.username} and all their content?`)) return;
    this.api.delete(`/admin/users/${u.id}`).subscribe({
      next: () => this.loadUsers(this.userQ),
      error: (e) => (this.error = e.message),
    });
  }

  loadPosts(q = ''): void {
    this.loading = true;
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    this.api.get<{ posts: AdminPost[] }>(`/admin/posts${query}`).subscribe({
      next: (r) => this.posts.set(r.posts),
      error: (e) => (this.error = e.message),
      complete: () => (this.loading = false),
    });
  }

  deletePost(p: AdminPost): void {
    if (!confirm(`Delete post #${p.id}?`)) return;
    this.api.delete(`/admin/posts/${p.id}`).subscribe({
      next: () => this.loadPosts(this.postQ),
      error: (e) => (this.error = e.message),
    });
  }

  loadComments(q = ''): void {
    this.loading = true;
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    this.api.get<{ comments: AdminComment[] }>(`/admin/comments${query}`).subscribe({
      next: (r) => this.comments.set(r.comments),
      error: (e) => (this.error = e.message),
      complete: () => (this.loading = false),
    });
  }

  deleteComment(c: AdminComment): void {
    if (!confirm(`Delete comment #${c.id}?`)) return;
    this.api.delete(`/admin/comments/${c.id}`).subscribe({
      next: () => this.loadComments(this.commentQ),
      error: (e) => (this.error = e.message),
    });
  }

  loadGroups(): void {
    this.api.get<{ groups: AdminGroup[] }>('/admin/groups').subscribe({
      next: (r) => this.groups.set(r.groups),
      error: (e) => (this.error = e.message),
    });
  }

  deleteGroup(g: AdminGroup): void {
    if (!confirm(`Delete group "${g.name}"?`)) return;
    this.api.delete(`/admin/groups/${g.id}`).subscribe({
      next: () => this.loadGroups(),
      error: (e) => (this.error = e.message),
    });
  }

  loadSettings(): void {
    this.api.get<{ settings: Record<string, string> }>('/admin/settings').subscribe({
      next: (r) => this.settings.set(r.settings),
      error: (e) => (this.error = e.message),
    });
  }

  saveSettings(): void {
    this.api.patch<{ settings: Record<string, string> }>('/admin/settings', { settings: this.settings() })
      .subscribe({
        next: (r) => this.settings.set(r.settings),
        error: (e) => (this.error = e.message),
      });
  }

  isTrue(key: string): boolean {
    return this.settings()?.[key] === 'true';
  }

  setBool(key: string, checked: boolean): void {
    const s = this.settings();
    if (s) s[key] = checked ? 'true' : 'false';
  }

  fmtDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
