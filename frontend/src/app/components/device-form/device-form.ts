import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceService, GenerateDescriptionRequest } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './device-form.html',
  styleUrl: './device-form.scss'
})
export class DeviceFormComponent implements OnInit {
  deviceForm!: FormGroup;
  isEdit = false;
  deviceId: number | null = null;
  submitting = false;
  loading = false;
  generatingDesc = false;
  serverError = '';

  private fb            = inject(FormBuilder);
  private deviceService = inject(DeviceService);
  private deviceState   = inject(DeviceStateService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private auth          = inject(AuthService);
  private cdr           = inject(ChangeDetectorRef);

  // Returns true when a field is invalid AND has been touched OR the form was submitted.
  // Drives both the red border and the error message — no clicking away required.
  isInvalid(name: string): boolean {
    const ctrl = this.deviceForm?.get(name);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  ngOnInit(): void {
    if (!this.auth.canWrite()) {
      this.router.navigate(['/devices']);
      return;
    }

    this.deviceForm = this.fb.group({
      name:        ['', Validators.required],
      manufacturer:['', Validators.required],
      type:        ['', Validators.required],
      os:          ['', Validators.required],
      osVersion:   ['', Validators.required],
      processor:   ['', Validators.required],
      ram:         ['', [Validators.required, Validators.min(1), Validators.max(128), Validators.pattern('^[0-9]+$')]],
      description: ['']
    });

    // Mark each field as touched as soon as the user changes it so errors
    // appear the moment the value becomes invalid, not only on blur.
    this.deviceForm.valueChanges.subscribe(() => {
      Object.keys(this.deviceForm.controls).forEach(key => {
        const ctrl = this.deviceForm.get(key);
        if (ctrl && ctrl.dirty) ctrl.markAsTouched();
      });
      // Clear server error when the user starts correcting fields
      if (this.serverError) this.serverError = '';
      this.cdr.detectChanges();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.deviceId = Number(id);
      this.loading = true;
      this.deviceService.getById(this.deviceId).subscribe({
        next: (device) => {
          this.deviceForm.patchValue(device);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/devices']);
        }
      });
    }
  }

  submit(): void {
    // Touch every field immediately so all errors appear at once
    this.deviceForm.markAllAsTouched();
    this.cdr.detectChanges();

    if (this.deviceForm.invalid) return;

    this.submitting = true;
    this.serverError = '';

    const raw = this.deviceForm.value as {
      name: string; manufacturer: string; type: string;
      os: string; osVersion: string; processor: string;
      ram: string; description: string | null;
    };

    const payload = {
      ...raw,
      type: raw.type.trim().charAt(0).toUpperCase() + raw.type.trim().slice(1).toLowerCase(),
      ram: Number(raw.ram)
    };

    const req = this.isEdit && this.deviceId
      ? this.deviceService.update(this.deviceId, payload)
      : this.deviceService.create(payload);

    req.subscribe({
      next: () => {
        this.deviceState.triggerRefresh();
        this.router.navigate(['/devices']);
      },
      error: (err: HttpErrorResponse) => {
        // Show the server error inline — no alert(), no click-away required
        if (err.status === 409) {
          this.serverError = err.error?.message ?? 'A device with this name already exists.';
        } else if (err.status === 400 && err.error?.errors) {
          const key = Object.keys(err.error.errors as Record<string, unknown>)[0];
          const val = (err.error.errors as Record<string, string[]>)[key];
          this.serverError = Array.isArray(val) ? val[0] : String(val);
        } else {
          this.serverError = err.error?.message ?? 'An error occurred while saving.';
        }
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateDescription(): void {
    const required = ['name', 'manufacturer', 'type', 'os', 'osVersion', 'processor', 'ram'];
    if (required.some(k => this.deviceForm.get(k)?.invalid)) {
      this.deviceForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }
    this.generatingDesc = true;
    const v = this.deviceForm.value as GenerateDescriptionRequest & { ram: string };
    this.deviceService.generateDescription({ ...v, ram: Number(v.ram) }).subscribe({
      next: (res: { description: string }) => {
        this.deviceForm.patchValue({ description: res.description });
        this.generatingDesc = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        // Show the exact message from the API (Gemini error, network error, etc.)
        this.serverError = err.error?.message ?? `AI generation failed (${err.status})`;
        this.generatingDesc = false;
        this.cdr.detectChanges();
      }
    });
  }

  back(): void { this.router.navigate(['/devices']); }
}