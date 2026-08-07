import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationsService } from '../services/notifications.service';
import { AvatarComponent } from '../shared/avatar.component';
import { LineSidebarComponent } from '../flux/line-sidebar.component';

interface SidebarLink {
  label: string;
  link: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent, LineSidebarComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  auth = inject(AuthService);
  notes = inject(NotificationsService);
  private router = inject(Router);

  activeIndex = signal<number | null>(null);
  private navSub?: Subscription;

  private baseLinks: SidebarLink[] = [
    { label: 'Home', link: '/' },
    { label: 'Explore', link: '/explore' },
    { label: 'Reels', link: '/reels' },
    { label: 'Sounds', link: '/sounds' },
    { label: 'Groups', link: '/groups' },
    { label: 'Saved', link: '/bookmarks' },
  ];

  navItems = computed<string[]>(() =>
    this.buildLinks(true).map((l) => l.label)
  );

  constructor() {
    this.updateActive(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateActive(e.url));
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  onItemClick({ index }: { index: number; label: string }): void {
    const target = this.buildLinks(false)[index];
    if (target) this.router.navigateByUrl(target.link);
  }

  private buildLinks(withUnread: boolean): SidebarLink[] {
    const links = [...this.baseLinks];
    if (this.auth.user()?.is_admin) {
      links.push({ label: 'Admin', link: '/admin' });
    }
    const unread = this.notes.unread();
    links.push({
      label: withUnread && unread > 0 ? `Notifications (${unread})` : 'Notifications',
      link: '/notifications',
    });
    links.push({ label: 'Messages', link: '/messages' });
    const me = this.auth.user();
    if (me) {
      links.push({ label: 'Profile', link: `/${me.username}` });
    }
    return links;
  }

  private updateActive(url: string): void {
    const links = this.buildLinks(false);
    const index = links.findIndex((l) =>
      l.link === '/' ? url === '/' : url === l.link || url.startsWith(l.link + '/')
    );
    this.activeIndex.set(index >= 0 ? index : null);
  }
}
