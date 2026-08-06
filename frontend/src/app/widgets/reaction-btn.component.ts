import { Component, inject, input, output, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Post } from '../models';
import { REACTIONS, reactionEmoji } from '../shared/hashtags';

@Component({
  selector: 'app-reaction-btn',
  imports: [],
  templateUrl: './reaction-btn.html',
  styleUrl: './reaction-btn.css',
})
export class ReactionBtnComponent {
  post = input.required<Post>();
  updated = output<Post>();

  private api = inject(ApiService);

  show = signal(false);
  reactions = REACTIONS;

  protected emoji = reactionEmoji;

  react(kind: string): void {
    this.api.post<{ post: Post }>(`/posts/${this.post().id}/like`, { kind }).subscribe({
      next: (r) => this.updated.emit(r.post),
      error: () => {},
    });
    this.show.set(false);
  }

  toggle(): void {
    const p = this.post();
    if (p.liked) {
      const req = p.my_reaction === 'like'
        ? this.api.delete<{ post: Post }>(`/posts/${p.id}/like`)
        : this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind: 'like' });
      req.subscribe({ next: (r) => this.updated.emit(r.post), error: () => {} });
    } else {
      this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind: 'like' }).subscribe({
        next: (r) => this.updated.emit(r.post),
        error: () => {},
      });
    }
  }
}
