import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  name     = '';
  email    = '';
  password = '';
  location = '';   // role field removed entirely from the form
  submitting = false;

  nameError     = '';
  emailError    = '';
  passwordError = '';
  locationError = '';
  serverError   = '';

  private submitted = false;
  private auth   = inject(AuthService);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  private namePattern     = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/;
  private locationPattern = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s',.-]+$/;

  validateName():     void { this.nameError     = !this.name.trim() ? 'Required.' : !this.namePattern.test(this.name) ? 'Letters and spaces only.' : ''; }
  validateLocation(): void { this.locationError = !this.location.trim() ? 'Required.' : !this.locationPattern.test(this.location) ? 'Letters and spaces only.' : ''; }
  validateEmail():    void { this.emailError    = !this.email.trim() ? 'Required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) ? 'Enter a valid email.' : ''; }
  validatePassword(): void { this.passwordError = !this.password ? 'Required.' : this.password.length < 6 ? 'At least 6 characters.' : ''; }

  onNameChange():     void { if (this.submitted || this.nameError)     this.validateName(); }
  onLocationChange(): void { if (this.submitted || this.locationError) this.validateLocation(); }
  onEmailChange():    void { this.validateEmail(); }
  onPasswordChange(): void { if (this.submitted || this.passwordError) this.validatePassword(); }

  private get isValid(): boolean {
    return !this.nameError && !this.emailError && !this.passwordError && !this.locationError
      && !!this.name.trim() && !!this.email.trim() && !!this.password && !!this.location.trim();
  }

  submit(): void {
    this.submitted = true;
    this.validateName(); this.validateEmail(); this.validatePassword(); this.validateLocation();
    this.cdr.detectChanges();
    if (!this.isValid) return;

    this.submitting  = true;
    this.serverError = '';

    // Role is not sent — the backend always assigns Employee
    this.auth.register({ name: this.name, email: this.email, password: this.password, location: this.location }).subscribe({
      next: () => this.router.navigate(['/devices']),
      error: err => {
        this.submitting = false;
        if (err.status === 409) this.emailError  = 'This email is already registered.';
        else                    this.serverError = err.error?.message ?? 'Registration failed.';
        this.cdr.detectChanges();
      }
    });
  }
}