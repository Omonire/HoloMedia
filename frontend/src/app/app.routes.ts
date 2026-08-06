import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { FeedComponent } from './pages/feed.component';
import { ExploreComponent } from './pages/explore.component';
import { ReelsComponent } from './pages/reels.component';
import { NotificationsComponent } from './pages/notifications.component';
import { MessagesComponent } from './pages/messages.component';
import { ConversationComponent } from './pages/conversation.component';
import { PostDetailComponent } from './pages/post-detail.component';
import { HashtagComponent } from './pages/hashtag.component';
import { BookmarksComponent } from './pages/bookmarks.component';
import { GroupsComponent } from './pages/groups.component';
import { GroupDetailComponent } from './pages/group-detail.component';
import { SoundsComponent } from './pages/sounds.component';
import { ProfileComponent } from './pages/profile.component';
import { AdminComponent } from './pages/admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: FeedComponent },
      { path: 'explore', component: ExploreComponent },
      { path: 'reels', component: ReelsComponent },
      { path: 'sounds', component: SoundsComponent },
      { path: 'groups', component: GroupsComponent },
      { path: 'groups/:id', component: GroupDetailComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'messages/:username', component: ConversationComponent },
      { path: 'p/:id', component: PostDetailComponent },
      { path: 'hashtag/:tag', component: HashtagComponent },
      { path: 'bookmarks', component: BookmarksComponent },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
      { path: ':username', component: ProfileComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
