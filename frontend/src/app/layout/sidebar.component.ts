import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationsService } from '../services/notifications.service';
import { AvatarComponent } from '../shared/avatar.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  auth = inject(AuthService);
  notes = inject(NotificationsService);
}
