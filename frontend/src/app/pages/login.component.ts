import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SeoService, SITE_URL } from '../services/seo.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);

  username = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

  ngOnInit(): void {
    this.seo.set({
      title: 'Log in',
      description: 'Log in to HoloMedia to share posts, loop reels, and connect with your community.',
      url: `${SITE_URL}/login`,
    });
  }

  submit(): void {
    if (!this.username() || !this.password()) {
      this.error.set('Please fill in both fields.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
