import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-detail.html',
  styleUrl: './device-detail.scss'
})
export class DeviceDetailComponent implements OnInit {
  device: Device | null = null;
  loading = true;
  error = '';
  actionError = '';

  private deviceService = inject(DeviceService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  get currentUserId(): number | null {
    return this.auth.getUserId();
  }

  get isAssignedToMe(): boolean {
    return this.device?.assignedUserId === this.currentUserId;
  }

  get isAvailable(): boolean {
    return this.device?.assignedUserId === null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDevice(id);
  }

  loadDevice(id: number): void {
    this.loading = true;
    this.deviceService.getById(id).subscribe({
      next: (data) => {
        this.device = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Device not found.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  assign(): void {
    if (!this.device) return;
    this.actionError = '';
    this.deviceService.assign(this.device.id).subscribe({
      next: (updated) => {
        this.device = updated;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Failed to assign device.';
        this.cdr.detectChanges();
      }
    });
  }

  unassign(): void {
    if (!this.device) return;
    this.actionError = '';
    this.deviceService.unassign(this.device.id).subscribe({
      next: (updated) => {
        this.device = updated;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Failed to unassign device.';
        this.cdr.detectChanges();
      }
    });
  }

  edit(): void {
    this.router.navigate(['/devices', this.device?.id, 'edit']);
  }

  back(): void {
    this.router.navigate(['/devices']);
  }
}