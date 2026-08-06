import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Post, User } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, PostCardComponent, AvatarComponent, TimeAgoPipe, ShimmerComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user = signal<User | null>(null);
  posts: Post[] = [];
  error = signal('');
  loading = true;

  tab: 'posts' | 'followers' | 'following' = 'posts';
  followers: User[] = [];
  following: User[] = [];
  followingLoading = false;

  editOpen = signal(false);
  editName = '';
  editBio = '';
  editColor = '#7c3aed';
  saving = false;
  saveError = '';

  private username = '';
  colors = ['#7c3aed', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username') ?? '';
    this.route.paramMap.subscribe((p) => {
      const uname = p.get('username') ?? '';
      if (uname !== this.username) {
        this.username = uname;
        this.loadAll();
      }
    });
    if (!this.posts.length) this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error.set('');
    this.api.get<{ user: User }>(`/users/${this.username}`).subscribe({
      next: (r) => this.user.set(r.user),
      error: (e) => this.error.set(e.message),
    });
    this.api.get<{ posts: Post[] }>(`/users/${this.username}/posts`).subscribe({
      next: (r) => {
        this.posts = r.posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  me = this.auth.user;

  isSelf(): boolean {
    return this.auth.user()?.id === this.user()?.id;
  }

  toggleFollow(): void {
    const u = this.user();
    if (!u || this.isSelf()) return;
    const req = u.is_following
      ? this.api.delete<{ user: User }>(`/users/${u.username}/follow`)
      : this.api.post<{ user: User }>(`/users/${u.username}/follow`);
    req.subscribe({ next: (r) => this.user.set(r.user) });
  }

  message(): void {
    this.router.navigate(['/messages', this.user()?.username]);
  }

  switchTab(t: typeof this.tab): void {
    this.tab = t;
    if (t === 'followers' && this.followers.length === 0) this.loadList(t);
    if (t === 'following' && this.following.length === 0) this.loadList(t);
  }

  private loadList(t: 'followers' | 'following'): void {
    this.followingLoading = true;
    this.api.get<{ users: User[] }>(`/users/${this.username}/${t}`).subscribe({
      next: (r) => {
        if (t === 'followers') this.followers = r.users;
        else this.following = r.users;
        this.followingLoading = false;
      },
      error: () => (this.followingLoading = false),
    });
  }

  openEdit(): void {
    const u = this.user();
    if (!u) return;
    this.editName = u.full_name;
    this.editBio = u.bio || '';
    this.editColor = u.avatar_color;
    this.editOpen.set(true);
  }

  saveEdit(): void {
    this.saving = true;
    this.saveError = '';
    this.api.put<{ user: User }>('/auth/me', {
      full_name: this.editName,
      bio: this.editBio,
      avatar_color: this.editColor,
    }).subscribe({
      next: (r) => {
        this.user.set(r.user);
        this.editOpen.set(false);
        this.saving = false;
        this.loadAll();
      },
      error: (e) => {
        this.saveError = e.message;
        this.saving = false;
      },
    });
  }

  pickColor(c: string): void {
    this.editColor = c;
  }

  onUpdated(p: Post): void {
    this.posts = this.posts.map((x) => (x.id === p.id ? p : x));
  }

  openPost(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }
}
