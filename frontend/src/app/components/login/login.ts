import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  submitting = false;

  private auth   = inject(AuthService);
  private router = inject(Router);

  submit(): void {
    if (!this.email || !this.password) { this.error = 'Email and password are required.'; return; }
    this.submitting = true;
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/devices']),
      error: (err) => {
        this.error = err.error?.message ?? 'Invalid email or password.';
        this.submitting = false;
      }
    });
  }
}