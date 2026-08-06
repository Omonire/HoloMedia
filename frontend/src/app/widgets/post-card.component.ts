import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Post } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';
import { REACTIONS, reactionEmoji, splitContent } from '../shared/hashtags';
import { ReactionBtnComponent } from './reaction-btn.component';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, AvatarComponent, TimeAgoPipe, ReactionBtnComponent],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCardComponent {
  post = input.required<Post>();
  updated = output<Post>();
  openComments = output<Post>();

  private api = inject(ApiService);
  private auth = inject(AuthService);

  showReactions = signal(false);
  reactions = REACTIONS;

  protected split = splitContent;
  protected emoji = reactionEmoji;

  canEdit(): boolean {
    return this.auth.user()?.id === this.post().author.id;
  }

  react(kind: string): void {
    const p = this.post();
    this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind }).subscribe({
      next: (r) => this.updated.emit(r.post),
      error: () => {},
    });
  }

  toggleLike(): void {
    const p = this.post();
    if (p.liked) {
      const req = p.my_reaction === 'like'
        ? this.api.delete<{ post: Post }>(`/posts/${p.id}/like`)
        : this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind: 'like' });
      req.subscribe({
        next: (r) => this.updated.emit(r.post),
        error: () => {},
      });
    } else {
      this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind: 'like' }).subscribe({
        next: (r) => this.updated.emit(r.post),
        error: () => {},
      });
    }
  }

  toggleRepost(): void {
    const p = this.post();
    const id = p.repost_of?.id ?? p.id;
    const req = p.reposted
      ? this.api.delete<{ post: Post }>(`/posts/${id}/repost`)
      : this.api.post<{ post: Post }>(`/posts/${id}/repost`);
    req.subscribe({
      next: (r) => this.updated.emit(r.post),
      error: () => {},
    });
  }

  toggleBookmark(): void {
    const p = this.post();
    const req = p.bookmarked
      ? this.api.delete<{ post: Post }>(`/posts/${p.id}/bookmark`)
      : this.api.post<{ post: Post }>(`/posts/${p.id}/bookmark`);
    req.subscribe({
      next: (r) => this.updated.emit(r.post),
      error: () => {},
    });
  }

  commentClick(): void {
    this.openComments.emit(this.post());
  }
}
