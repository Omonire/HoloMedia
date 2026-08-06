import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  password = signal('');
  error = signal('');
  busy = signal(false);

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
