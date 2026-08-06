import { AfterViewInit, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  private auth = inject(AuthService);

  constructor() {
    this.auth.init();
  }

  ngAfterViewInit(): void {
    const el = document.getElementById('hm-splash');
    if (!el) return;

    const hide = () => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 600);
    };

    const check = () => {
      if (!this.auth.loading()) hide();
      else setTimeout(check, 60);
    };
    check();

    setTimeout(hide, 4000);
  }
}
