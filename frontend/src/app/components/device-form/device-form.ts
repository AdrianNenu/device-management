import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReactiveFormsModule, FormBuilder, Validators,
  FormGroup, FormControl
} from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../components/icon/icon.component';
import { DeviceFormValue, CreateDevice } from '../../models/device';

// Typed FormGroup — perfectly matches what FormBuilder generates
type DeviceForm = FormGroup<{
  name:        FormControl<string>;
  manufacturer:FormControl<string>;
  type:        FormControl<string>;
  os:          FormControl<string>;
  osVersion:   FormControl<string>;
  processor:   FormControl<string>;
  ram:         FormControl<number | null>;
  description: FormControl<string | null>;
}>;

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './device-form.html',
  styleUrl: './device-form.scss'
})
export class DeviceFormComponent implements OnInit {
  deviceForm!: DeviceForm;
  isEdit       = false;
  deviceId: number | null = null;
  submitting   = false;
  loading      = false;
  generatingDesc = false;
  serverError  = '';

  private fb            = inject(FormBuilder);
  private deviceService = inject(DeviceService);
  private deviceState   = inject(DeviceStateService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private auth          = inject(AuthService);
  private cdr           = inject(ChangeDetectorRef);

  isInvalid(name: keyof DeviceFormValue): boolean {
    const ctrl = this.deviceForm?.get(name);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  ngOnInit(): void {
    if (!this.auth.canWrite()) {
      this.router.navigate(['/devices']);
      return;
    }

    this.deviceForm = this.fb.group({
      name:        this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      manufacturer:this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      type:        this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      os:          this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      osVersion:   this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      processor:   this.fb.control('',   { validators: [Validators.required], nonNullable: true }),
      ram:         this.fb.control<number | null>(null, {
                     validators: [Validators.required, Validators.min(1), Validators.max(128)]
                   }),
      description: this.fb.control<string | null>(null)
    }); // No 'as' cast needed anymore!

    this.deviceForm.valueChanges.subscribe(() => {
      Object.keys(this.deviceForm.controls).forEach(key => {
        const ctrl = this.deviceForm.get(key);
        if (ctrl?.dirty) ctrl.markAsTouched();
      });
      if (this.serverError) this.serverError = '';
      this.cdr.detectChanges();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit   = true;
      this.deviceId = Number(id);
      this.loading  = true;
      this.deviceService.getById(this.deviceId).subscribe({
        next: device => {
          this.deviceForm.patchValue(device);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.router.navigate(['/devices']); }
      });
    }
  }

  submit(): void {
    this.deviceForm.markAllAsTouched();
    this.cdr.detectChanges();
    if (this.deviceForm.invalid) return;

    this.submitting  = true;
    this.serverError = '';

    const v = this.deviceForm.getRawValue();
    
    // Explicitly typed as CreateDevice to satisfy API expectations
    const payload: CreateDevice = {
      ...v,
      type: v.type.trim().charAt(0).toUpperCase() + v.type.trim().slice(1).toLowerCase(),
      ram:  v.ram ?? 0
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
        if (err.status === 409) {
          this.serverError = err.error?.message ?? 'A device with this name already exists.';
        } else if (err.status === 400 && err.error?.errors) {
          const errors = err.error.errors as Record<string, string[]>;
          const key    = Object.keys(errors)[0];
          this.serverError = errors[key]?.[0] ?? 'Validation error.';
        } else {
          this.serverError = err.error?.message ?? 'An error occurred while saving.';
        }
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateDescription(): void {
    const required: (keyof DeviceFormValue)[] = ['name', 'manufacturer', 'type', 'os', 'osVersion', 'processor', 'ram'];
    if (required.some(k => this.deviceForm.get(k)?.invalid)) {
      this.deviceForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.generatingDesc = true;
    const v = this.deviceForm.getRawValue();

    this.deviceService.generateDescription({
      name: v.name, manufacturer: v.manufacturer, type: v.type,
      os: v.os, osVersion: v.osVersion, processor: v.processor, ram: v.ram ?? 0
    }).subscribe({
      next: (res: { description: string }) => {
        this.deviceForm.patchValue({ description: res.description });
        this.generatingDesc = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.serverError    = err.error?.message ?? `AI generation failed (${err.status})`;
        this.generatingDesc = false;
        this.cdr.detectChanges();
      }
    });
  }

  back(): void { this.router.navigate(['/devices']); }
}