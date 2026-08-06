import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Group, Post, User } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-group-detail',
  imports: [RouterLink, FormsModule, PostCardComponent, AvatarComponent, TimeAgoPipe, ShimmerComponent],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.css',
})
export class GroupDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  auth = inject(AuthService);

  group = signal<Group | null>(null);
  posts: Post[] = [];
  members: User[] = [];
  loading = true;
  error = signal('');

  draft = '';
  mediaOpen = signal(false);
  imageUrl = '';
  videoUrl = '';
  posting = false;
  postError = '';

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGroup();
  }

  private loadGroup(): void {
    this.api.get<{ group: Group }>(`/groups/${this.id}`).subscribe({
      next: (r) => {
        this.group.set(r.group);
        this.loadPosts();
        this.loadMembers();
      },
      error: (e) => {
        this.error.set(e.message);
        this.loading = false;
      },
    });
  }

  private loadPosts(): void {
    this.api.get<{ posts: Post[] }>(`/groups/${this.id}/posts`).subscribe({
      next: (r) => {
        this.posts = r.posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private loadMembers(): void {
    this.api.get<{ members: User[] }>(`/groups/${this.id}/members`).subscribe({
      next: (r) => (this.members = r.members),
      error: () => {},
    });
  }

  toggleJoin(): void {
    const g = this.group();
    if (!g) return;
    const req = g.is_member
      ? this.api.delete<{ group: Group }>(`/groups/${g.id}/join`)
      : this.api.post<{ group: Group }>(`/groups/${g.id}/join`);
    req.subscribe({
      next: (r) => {
        this.group.set(r.group);
        if (r.group.is_member) {
          this.loadPosts();
          this.loadMembers();
        }
      },
      error: () => {},
    });
  }

  publish(): void {
    const g = this.group();
    const content = this.draft.trim();
    const image = this.imageUrl.trim();
    const video = this.videoUrl.trim();
    if ((!content && !image && !video) || this.posting) return;
    this.posting = true;
    this.postError = '';
    this.api.post<{ post: Post }>(`/groups/${g!.id}/posts`, {
      content,
      image_url: image || undefined,
      video_url: video || undefined,
    }).subscribe({
      next: (r) => {
        this.posts = [r.post, ...this.posts];
        this.draft = '';
        this.imageUrl = '';
        this.videoUrl = '';
        this.posting = false;
        this.group.set({ ...g!, posts_count: g!.posts_count + 1 });
      },
      error: (e) => {
        this.postError = e.message;
        this.posting = false;
      },
    });
  }

  uploading = false;
  uploadError = '';

  onVideoFile(file: File | null): void {
    this.uploadError = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.uploadError = 'Please choose a video file.';
      return;
    }
    this.uploading = true;
    this.api.uploadVideo<{ url: string }>(file).subscribe({
      next: (r) => {
        this.videoUrl = r.url;
        this.uploading = false;
      },
      error: (e) => {
        this.uploadError = e.message;
        this.uploading = false;
      },
    });
  }

  onUpdated(p: Post): void {
    this.posts = this.posts.map((x) => (x.id === p.id ? p : x));
  }
}
