import { Component, ElementRef, AfterViewInit, OnDestroy, inject, signal, viewChildren } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Post } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { splitContent, reactionEmoji } from '../shared/hashtags';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-reels',
  imports: [RouterLink, AvatarComponent, ShimmerComponent],
  templateUrl: './reels.html',
  styleUrl: './reels.css',
})
export class ReelsComponent implements AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);

  videos = signal<Post[]>([]);
  loading = true;
  currentId = signal(0);

  videosEl = viewChildren<ElementRef<HTMLVideoElement>>('video');
  private observer?: IntersectionObserver;

  protected split = splitContent;
  protected emoji = reactionEmoji;

  ngOnInit(): void {
    this.api.get<{ posts: Post[] }>('/posts/reels').subscribe({
      next: (r) => {
        this.videos.set(r.posts);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const vid = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            this.currentId.set(Number((entry.target as HTMLElement).dataset['id']));
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        }
      },
      { threshold: 0.6 }
    );
    setTimeout(() => this.videosEl().forEach((v) => this.observer!.observe(v.nativeElement)), 100);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  togglePlay(): void {
    const vid = this.videosEl().find(
      (v) => Number((v.nativeElement as HTMLElement).dataset['id']) === this.currentId()
    );
    if (!vid) return;
    const el = vid.nativeElement;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  react(p: Post, kind: string): void {
    this.api.post<{ post: Post }>(`/posts/${p.id}/like`, { kind }).subscribe({
      next: (r) => this.videos.set(this.videos().map((x) => (x.id === r.post.id ? r.post : x))),
      error: () => {},
    });
  }

  bookmark(p: Post): void {
    const req = p.bookmarked
      ? this.api.delete<{ post: Post }>(`/posts/${p.id}/bookmark`)
      : this.api.post<{ post: Post }>(`/posts/${p.id}/bookmark`);
    req.subscribe({
      next: (r) => this.videos.set(this.videos().map((x) => (x.id === r.post.id ? r.post : x))),
      error: () => {},
    });
  }

  openComments(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }

  onUpdated(p: Post): void {
    this.videos.set(this.videos().map((x) => (x.id === p.id ? p : x)));
  }
}
