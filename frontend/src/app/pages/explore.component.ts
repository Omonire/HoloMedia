import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Post, User } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { AvatarComponent } from '../shared/avatar.component';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-explore',
  imports: [FormsModule, PostCardComponent, AvatarComponent, ShimmerComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class ExploreComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private auth = inject(AuthService);

  q = signal('');
  users: User[] = [];
  posts: Post[] = [];
  searched = signal(false);
  searching = signal(false);

  ngOnInit(): void {
    this.api.get<{ posts: Post[] }>('/posts/').subscribe({
      next: (r) => (this.posts = r.posts),
      error: () => {},
    });
  }

  search(): void {
    const term = this.q().trim();
    if (!term) return;
    this.searching.set(true);
    this.searched.set(true);
    this.api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(term)}`).subscribe({
      next: (r) => {
        const me = this.auth.user();
        this.users = r.users.filter((u) => me && u.id !== me.id);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }

  follow(u: User): void {
    const req = u.is_following
      ? this.api.delete(`/users/${u.username}/follow`)
      : this.api.post(`/users/${u.username}/follow`);
    req.subscribe((r: any) => {
      u.is_following = r.user.is_following;
      u.followers_count = r.user.followers_count;
    });
  }

  open(u: User): void {
    this.router.navigate(['/', u.username]);
  }

  onUpdated(p: Post): void {
    this.posts = this.posts.map((x) => (x.id === p.id ? p : x));
  }

  openPost(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }
}
