import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Post, SpotifyTrack } from '../models';
import { PostCardComponent } from '../widgets/post-card.component';
import { AvatarComponent } from '../shared/avatar.component';

@Component({
  selector: 'app-feed',
  imports: [FormsModule, PostCardComponent, AvatarComponent],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class FeedComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  posts: Post[] = [];
  draft = '';
  videoUrl = '';
  sound = '';
  soundTrackId = '';
  soundArtist = '';
  soundArtwork = '';
  soundPreview = '';
  soundUrl = '';
  mode = signal<'text' | 'video'>('text');
  error = '';
  loading = true;
  posting = false;

  spotifyOk = signal(false);
  searching = signal(false);
  soundResults: SpotifyTrack[] = [];
  soundSuggestions: string[] = [];
  searchQuery = '';
  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.api.get<{ posts: Post[] }>('/posts/feed').subscribe({
      next: (r) => {
        this.posts = r.posts;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    this.api.get<{ sounds: { name: string }[] }>('/posts/sounds').subscribe({
      next: (r) => (this.soundSuggestions = r.sounds.map((s) => s.name)),
      error: () => {},
    });
    this.api.get<{ configured: boolean }>('/posts/spotify/config').subscribe({
      next: (r) => this.spotifyOk.set(r.configured),
      error: () => this.spotifyOk.set(false),
    });
    this.searchSub = this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap(() => this.searching.set(true)),
        switchMap((q) => this.api.get<{ tracks: SpotifyTrack[] }>(
          `/posts/spotify/search?q=${encodeURIComponent(q)}`)),
        tap(() => this.searching.set(false)),
      )
      .subscribe({
        next: (r) => (this.soundResults = r.tracks),
        error: () => {
          this.searching.set(false);
          this.soundResults = [];
          this.spotifyOk.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSoundSearch(q: string): void {
    this.searchQuery = q;
    if (q.trim().length >= 2) this.search$.next(q);
    else this.soundResults = [];
  }

  pickTrack(t: SpotifyTrack): void {
    this.sound = t.name;
    this.soundTrackId = t.id;
    this.soundArtist = t.artist;
    this.soundArtwork = t.artwork_url ?? '';
    this.soundPreview = t.preview_url ?? '';
    this.soundUrl = t.spotify_url ?? '';
    this.soundResults = [];
    this.searchQuery = '';
  }

  clearSound(): void {
    this.sound = '';
    this.soundTrackId = '';
    this.soundArtist = '';
    this.soundArtwork = '';
    this.soundPreview = '';
    this.soundUrl = '';
    this.soundResults = [];
    this.searchQuery = '';
  }

  publish(): void {
    const content = this.draft.trim();
    const video = this.mode() === 'video' ? this.videoUrl.trim() : '';
    if ((!content && !video) || this.posting) return;
    if (video && !/^(https?:\/\/|\/api\/uploads\/)/i.test(video)) {
      this.error = 'Video must be a URL (http/https) or an uploaded file.';
      return;
    }
    this.posting = true;
    this.error = '';
    this.api.post<{ post: Post }>('/posts/', {
      content,
      video_url: video || undefined,
      sound: this.mode() === 'video' ? this.sound.trim() || undefined : undefined,
      sound_track_id: this.soundTrackId || undefined,
      sound_artist: this.soundArtist || undefined,
      sound_artwork: this.soundArtwork || undefined,
      sound_preview: this.soundPreview || undefined,
      sound_url: this.soundUrl || undefined,
    }).subscribe({
      next: (r) => {
        this.posts = [r.post, ...this.posts];
        this.draft = '';
        this.videoUrl = '';
        this.clearSound();
        this.posting = false;
      },
      error: (e) => {
        this.error = e.message;
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

  openPost(p: Post): void {
    this.router.navigate(['/p', p.id]);
  }
}
