import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Post } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-bookmarks',
  imports: [RouterLink, PostCardComponent, ShimmerComponent],
  templateUrl: './bookmarks.html',
  styleUrl: './bookmarks.css',
})
export class BookmarksComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  posts: Post[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.get<{ posts: Post[] }>('/posts/bookmarks').subscribe({
      next: (r) => {
        this.posts = r.posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onUpdated(p: Post): void {
    if (!p.bookmarked) {
      this.posts = this.posts.filter((x) => x.id !== p.id);
    } else {
      this.posts = this.posts.map((x) => (x.id === p.id ? p : x));
    }
  }

  openPost(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }
}
