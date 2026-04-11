import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  name = ''; email = ''; password = ''; role = 'Employee'; location = '';
  error = ''; submitting = false;

  private auth   = inject(AuthService);
  private router = inject(Router);

  submit(): void {
    if (!this.name || !this.email || !this.password || !this.location) {
      this.error = 'All fields are required.'; return;
    }
    this.submitting = true;
    this.error = '';
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role, location: this.location }).subscribe({
      next: () => this.router.navigate(['/devices']),
      error: (err) => {
        this.error = err.error?.message ?? 'Registration failed.';
        this.submitting = false;
      }
    });
  }
}