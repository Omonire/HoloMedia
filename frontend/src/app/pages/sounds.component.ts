import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { Post, SpotifyTrack } from '../models';

interface Sound {
  name: string;
  track_id: string | null;
  artist: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  spotify_url: string | null;
  count: number;
  creator: string;
  creator_username: string;
  avatar_color: string;
  posts: Post[];
}

@Component({
  selector: 'app-sounds',
  imports: [RouterLink, FormsModule],
  templateUrl: './sounds.html',
  styleUrl: './sounds.css',
})
export class SoundsComponent {
  private api = inject(ApiService);

  sounds = signal<Sound[]>([]);
  selected = signal<string | null>(null);
  posts: Post[] = [];
  loading = true;

  spotifyOk = signal(false);
  query = '';
  searching = signal(false);
  results: SpotifyTrack[] = [];
  playing = signal<string | null>(null);

  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.api.get<{ configured: boolean }>('/posts/spotify/config').subscribe({
      next: (r) => this.spotifyOk.set(r.configured),
      error: () => this.spotifyOk.set(false),
    });
    this.api.get<{ sounds: Sound[] }>('/posts/sounds').subscribe({
      next: (r) => {
        this.sounds.set(r.sounds);
        this.loading = false;
        if (r.sounds.length > 0) this.select(r.sounds[0]);
      },
      error: () => (this.loading = false),
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
        next: (r) => (this.results = r.tracks),
        error: () => {
          this.searching.set(false);
          this.results = [];
        },
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearch(q: string): void {
    this.query = q;
    if (q.trim().length >= 2) this.search$.next(q);
    else this.results = [];
  }

  select(s: Sound): void {
    if (this.selected() === s.name) return;
    this.selected.set(s.name);
    this.posts = [];
    const q = encodeURIComponent(s.name);
    this.api.get<{ posts: Post[] }>(`/posts/reels?sound=${q}`).subscribe({
      next: (r) => (this.posts = r.posts),
      error: () => {},
    });
  }

  togglePlay(t: SpotifyTrack): void {
    if (this.playing() === t.id) this.playing.set(null);
    else this.playing.set(t.id);
  }

  onEnded(): void {
    this.playing.set(null);
  }

  fmtDuration(ms: number | null): string {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  playPreview(el: EventTarget | null): void {
    const video = el as HTMLVideoElement | null;
    video?.play().catch(() => {});
  }

  pausePreview(el: EventTarget | null): void {
    const video = el as HTMLVideoElement | null;
    video?.pause();
  }
}
