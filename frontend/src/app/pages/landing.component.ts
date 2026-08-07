import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService, SITE_URL } from '../services/seo.service';

interface LandingFeature {
  title: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  private seo = inject(SeoService);

  features: LandingFeature[] = [
    {
      title: 'Timeline',
      desc: 'A feed of the people and communities you care about, with rich embeds and reactions.',
      icon: 'M4 5h16M4 12h16M4 19h10',
    },
    {
      title: 'Reels',
      desc: 'Short, looping video stories with sound. Swipe, like, and share in a flash.',
      icon: 'M4 5h10l6 6-6 6H4z',
    },
    {
      title: 'Sounds',
      desc: 'Browse trending audio, preview tracks, and attach the perfect sound to any post.',
      icon: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    },
    {
      title: 'Groups',
      desc: 'Private spaces to hang out with your people — post, chat, and plan together.',
      icon: 'M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM4 20v-1a6 6 0 0 1 12 0v1M16 11a4 4 0 0 0 0-8M20 20v-1a6 6 0 0 0-4-5.6',
    },
    {
      title: 'Direct messages',
      desc: 'One-on-one conversations that stay fast, personal, and private.',
      icon: 'M21 5H3v14h18zM3 7l9 6 9-6',
    },
    {
      title: 'Live notifications',
      desc: 'Realtime alerts for likes, follows, comments, and messages — right as they happen.',
      icon: 'M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M5.6 18.4l2.1-2.1M3 12h3M18.4 18.4l-2.1-2.1M5.6 5.6l2.1 2.1M12 9a3 3 0 1 1-3 3 3 3 0 0 1 3-3z',
    },
  ];

  ngOnInit(): void {
    this.seo.set({
      title: 'HoloMedia — Share posts, loop reels, drop sounds',
      description: 'HoloMedia is a social media platform to share posts, loop short-form video reels, drop sounds, and connect in interest-based groups — free forever.',
      url: SITE_URL,
    });
  }
}
