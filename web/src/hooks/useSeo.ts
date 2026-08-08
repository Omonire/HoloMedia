import { useEffect } from 'react';

export const SITE_URL = 'https://holomedia.vercel.app';

export interface SeoOptions {
  title: string;
  description: string;
  url?: string;
  image?: string | null;
}

function setMeta(attrs: Record<string, string>): void {
  const el = document.querySelector(`meta[${attrs.id ?? 'name'}="${attrs.name ?? ''}"]`);
  if (el) {
    el.setAttribute(attrs.id ?? 'name', attrs.name ?? '');
    el.setAttribute('content', attrs.content);
  }
}

export function setSeo({ title, description, url, image }: SeoOptions): void {
  const fullTitle = title.endsWith('| HoloMedia') ? title : `${title} | HoloMedia`;
  document.title = fullTitle;
  const meta: Array<Record<string, string>> = [
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'HoloMedia' },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
  ];
  if (url) {
    meta.push({ property: 'og:url', content: url });
  }
  if (image) {
    meta.push({ property: 'og:image', content: image });
    meta.push({ name: 'twitter:image', content: image });
  }
  for (const m of meta) setMeta(m);
}

export function useSeo(opts: SeoOptions): void {
  useEffect(() => {
    setSeo(opts);
  }, [opts.title, opts.description, opts.url, opts.image]);
}
