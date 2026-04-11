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
  location = '';
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

  validateName(): void {
    if (!this.name.trim())                         { this.nameError = 'Full name is required.'; return; }
    if (!this.namePattern.test(this.name))         { this.nameError = 'Name can only contain letters and spaces.'; return; }
    this.nameError = '';
  }

  validateLocation(): void {
    if (!this.location.trim())                     { this.locationError = 'Location is required.'; return; }
    if (!this.locationPattern.test(this.location)) { this.locationError = 'Location can only contain letters and spaces.'; return; }
    this.locationError = '';
  }

  validateEmail(): void {
    if (!this.email.trim())                        { this.emailError = 'Email is required.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) { this.emailError = 'Enter a valid email address.'; return; }
    this.emailError = '';
  }

  validatePassword(): void {
    if (!this.password)           { this.passwordError = 'Password is required.'; return; }
    if (this.password.length < 6) { this.passwordError = 'Must be at least 6 characters.'; return; }
    this.passwordError = '';
  }

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
    this.validateName();
    this.validateEmail();
    this.validatePassword();
    this.validateLocation();
    this.cdr.detectChanges();

    if (!this.isValid) return;

    this.submitting = true;
    this.serverError = '';

    // Role is always Employee — roles are assigned by admins, not self-selected
    this.auth.register({
      name: this.name, email: this.email,
      password: this.password, role: 'Employee', location: this.location
    }).subscribe({
      next: () => this.router.navigate(['/devices']),
      error: (err) => {
        this.submitting = false;
        if (err.status === 409) {
          this.emailError = 'This email address is already registered.';
        } else {
          this.serverError = err.error?.message ?? 'Registration failed. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}