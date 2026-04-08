import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-form.html',
  styleUrl: './device-form.scss'
})
export class DeviceFormComponent implements OnInit {
  isEdit = false;
  deviceId: number | null = null;
  submitting = false;
  loading = false;
  error = '';

  name = '';
  manufacturer = '';
  type = '';
  os = '';
  osVersion = '';
  processor = '';
  ram = 0;
  description: string | null = null;

  private deviceService = inject(DeviceService);
  private deviceState = inject(DeviceStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEdit = true;
      this.deviceId = Number(id);
      this.loading = true;

      this.deviceService.getById(this.deviceId).subscribe({
        next: (device) => {
          this.name = device.name;
          this.manufacturer = device.manufacturer;
          this.type = device.type;
          this.os = device.os;
          this.osVersion = device.osVersion;
          this.processor = device.processor;
          this.ram = device.ram;
          this.description = device.description;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Failed to load device.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  submit(): void {
    if (!this.name || !this.manufacturer || !this.type ||
        !this.os || !this.osVersion || !this.processor || !this.ram) {
      this.error = 'All fields except description are required.';
      return;
    }

    this.submitting = true;
    this.error = '';

    const payload = {
      name: this.name,
      manufacturer: this.manufacturer,
      type: this.type,
      os: this.os,
      osVersion: this.osVersion,
      processor: this.processor,
      ram: this.ram,
      description: this.description
    };

    const request = this.isEdit && this.deviceId
      ? this.deviceService.update(this.deviceId, payload)
      : this.deviceService.create(payload);

    request.subscribe({
      next: () => {
        this.deviceState.triggerRefresh();
        this.router.navigate(['/devices']);
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Something went wrong.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  back(): void {
    this.router.navigate(['/devices']);
  }

  generatingDesc = false;

  generateDescription(): void {
    // Grab the current values directly from the class properties
    const specs = {
      name: this.name,
      manufacturer: this.manufacturer,
      type: this.type,
      os: this.os,
      osVersion: this.osVersion,
      processor: this.processor,
      ram: this.ram
    };

    if (!specs.name || !specs.manufacturer || !specs.os) {
      alert('Please fill out the Name, Manufacturer, and OS fields first!');
      return;
    }

    this.generatingDesc = true;
    this.deviceService.generateDescription(specs).subscribe({
      next: (res) => {
        // Assign the result back to the flat description property
        this.description = res.description;
        this.generatingDesc = false;
        this.cdr.detectChanges(); // Ensure the UI updates immediately
      },
      error: () => {
        alert('Failed to generate description.');
        this.generatingDesc = false;
        this.cdr.detectChanges();
      }
    });
  }
  

}