import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SeoService, SITE_URL } from '../services/seo.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './auth.css',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);

  username = signal('');
  email = signal('');
  fullName = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

  ngOnInit(): void {
    this.seo.set({
      title: 'Create your free account',
      description: 'Join HoloMedia free — no email verification needed. Share posts, loop reels, and connect in groups.',
      url: `${SITE_URL}/register`,
    });
  }

  submit(): void {
    if (!this.username() || !this.email() || !this.fullName() || !this.password()) {
      this.error.set('Please fill in all fields.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.register({
      username: this.username(),
      email: this.email(),
      full_name: this.fullName(),
      password: this.password(),
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
