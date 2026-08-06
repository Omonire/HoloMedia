import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Comment, Post } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';

@Component({
  selector: 'app-comments',
  imports: [FormsModule, RouterLink, AvatarComponent, TimeAgoPipe],
  templateUrl: './comments.html',
  styleUrl: './comments.css',
})
export class CommentsComponent {
  postId = input.required<number>();
  postChanged = output<Post>();

  comments: Comment[] = [];
  text = '';
  loading = false;

  constructor(private api: ApiService) {}

  load(): void {
    this.api.get<{ comments: Comment[] }>(`/posts/${this.postId()}/comments`).subscribe({
      next: (r) => (this.comments = r.comments),
      error: () => {},
    });
  }

  send(): void {
    const content = this.text.trim();
    if (!content) return;
    this.loading = true;
    this.api.post<{ comment: Comment; post: Post }>(`/posts/${this.postId()}/comments`, { content })
      .subscribe({
        next: (r) => {
          this.comments = [...this.comments, r.comment];
          this.postChanged.emit(r.post);
          this.text = '';
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }
}
