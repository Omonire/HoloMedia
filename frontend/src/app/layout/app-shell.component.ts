import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { RightSideComponent } from './right-side.component';
import { NotificationsService } from '../services/notifications.service';
import { SocketService } from '../services/socket.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, RightSideComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShellComponent implements OnInit, OnDestroy {
  private notes = inject(NotificationsService);
  private auth = inject(AuthService);
  private socket = inject(SocketService);

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      this.notes.start();
      this.socket.connect();
    }
  }

  ngOnDestroy(): void {
    this.notes.stop();
    this.socket.disconnect();
  }
}
