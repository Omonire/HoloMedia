import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Post } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { CommentsComponent } from '../widgets/comments.component';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, PostCardComponent, CommentsComponent],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  post = signal<Post | null>(null);
  error = signal('');
  commentsLoaded = false;
  deleting = false;

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.api.get<{ post: Post }>(`/posts/${this.id}`).subscribe({
      next: (r) => this.post.set(r.post),
      error: (e) => this.error.set(e.message),
    });
  }

  isMine(): boolean {
    return this.auth.user()?.id === this.post()?.author.id;
  }

  deletePost(): void {
    if (!confirm('Delete this post permanently?')) return;
    this.deleting = true;
    this.api.delete(`/posts/${this.id}`).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(e.message);
        this.deleting = false;
      },
    });
  }
}
