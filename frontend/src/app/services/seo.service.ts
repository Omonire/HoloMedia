import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://holomedia.vercel.app';

export interface SeoOptions {
  title: string;
  description: string;
  url?: string;
  image?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);

  set({ title, description, url, image }: SeoOptions): void {
    const fullTitle = title.endsWith('| HoloMedia') ? title : `${title} | HoloMedia`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'HoloMedia' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    if (url) {
      this.meta.updateTag({ property: 'og:url', content: url });
      this.meta.updateTag({ rel: 'canonical', href: url }, 'rel="canonical"');
    }
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    }
  }
}
