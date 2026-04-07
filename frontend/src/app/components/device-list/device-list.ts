import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-list.html',
  styleUrl: './device-list.scss'
})
export class DeviceListComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  loading = true;
  error = '';

  private deviceService = inject(DeviceService);
  private deviceState = inject(DeviceStateService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private sub = new Subscription();

  get userName(): string | null {
    return this.auth.getUserName();
  }

  ngOnInit(): void {
    this.loadDevices();
    this.sub.add(
      this.deviceState.refresh$.subscribe(() => this.loadDevices())
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadDevices(): void {
    this.loading = true;
    this.error = '';
    this.deviceService.getAll().subscribe({
      next: (data) => {
        this.devices = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load devices.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDevice(id: number): void {
    this.router.navigate(['/devices', id]);
  }

  newDevice(): void {
    this.router.navigate(['/devices/new']);
  }

  deleteDevice(event: Event, id: number): void {
    event.stopPropagation();
    if (!confirm('Delete this device?')) return;
    this.deviceService.delete(id).subscribe({
      next: () => this.deviceState.triggerRefresh(),
      error: () => {
        this.error = 'Failed to delete device.';
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}