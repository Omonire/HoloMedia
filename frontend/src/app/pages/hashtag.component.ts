import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Post } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';

@Component({
  selector: 'app-hashtag',
  imports: [RouterLink, PostCardComponent],
  templateUrl: './hashtag.html',
  styleUrl: './hashtag.css',
})
export class HashtagComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  tag = signal('');
  posts: Post[] = [];
  loading = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      this.tag.set(p.get('tag') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.get<{ posts: Post[] }>(`/posts/?tag=${encodeURIComponent(this.tag())}`).subscribe({
      next: (r) => {
        this.posts = r.posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onUpdated(p: Post): void {
    this.posts = this.posts.map((x) => (x.id === p.id ? p : x));
  }

  openPost(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }
}
