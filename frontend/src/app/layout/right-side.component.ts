import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { UserSearchComponent } from '../shared/user-search.component';

@Component({
  selector: 'app-right-side',
  imports: [AvatarComponent, UserSearchComponent, RouterLink],
  templateUrl: './right-side.html',
  styleUrl: './right-side.css',
})
export class RightSideComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  suggestions: User[] = [];
  trending: { tag: string; count: number }[] = [];
  query = '';
  searchOpen = false;

  constructor() {
    this.api.get<{ users: User[] }>('/suggestions').subscribe({
      next: (r) => {
        const me = this.auth.user();
        this.suggestions = r.users.filter((u) => me && u.id !== me.id).slice(0, 4);
      },
      error: () => {},
    });
    this.api.get<{ trending: { tag: string; count: number }[] }>('/posts/trending').subscribe({
      next: (r) => (this.trending = r.trending),
      error: () => {},
    });
  }

  follow(u: User): void {
    if (u.is_following) {
      this.api.delete(`/users/${u.username}/follow`).subscribe((r: any) => {
        u.is_following = r.user.is_following;
        u.followers_count = r.user.followers_count;
      });
    } else {
      this.api.post(`/users/${u.username}/follow`).subscribe((r: any) => {
        u.is_following = r.user.is_following;
        u.followers_count = r.user.followers_count;
      });
    }
  }

  openUser(u: User): void {
    this.router.navigate(['/', u.username]);
  }
}
