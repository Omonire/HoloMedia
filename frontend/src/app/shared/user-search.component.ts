import { Component, OnInit, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models';
import { AvatarComponent } from './avatar.component';
import { ShimmerComponent } from './shimmer.component';

@Component({
  selector: 'app-user-search',
  imports: [AvatarComponent, ShimmerComponent],
  templateUrl: './user-search.html',
  styleUrl: './user-search.css',
})
export class UserSearchComponent implements OnInit {
  q = input.required<string>();
  close = output<void>();

  private api = inject(ApiService);
  private router = inject(Router);
  private auth = inject(AuthService);

  results: User[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(this.q())}`)
      .subscribe({
        next: (r) => {
          const me = this.auth.user();
          this.results = r.users.filter((u) => me && u.id !== me.id);
        },
        complete: () => (this.loading = false),
        error: () => (this.loading = false),
      });
  }

  open(u: User): void {
    this.close.emit();
    this.router.navigate(['/', u.username]);
  }
}
