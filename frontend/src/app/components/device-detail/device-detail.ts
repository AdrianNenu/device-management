import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { AuthService } from '../../services/auth.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './device-detail.html',
  styleUrl: './device-detail.scss'
})
export class DeviceDetailComponent implements OnInit {
  device: Device | null = null;
  loading = true;
  actionLoading = false;

  private deviceService = inject(DeviceService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
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
      next: (data: Device) => {
        this.device = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Device not found', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/devices']);
      }
    });
  }

  assign(): void {
    if (!this.device) return;
    this.actionLoading = true;

    this.deviceService.assign(this.device.id).subscribe({
      next: (updated: Device) => {
        this.device = updated;
        this.actionLoading = false;
        this.snackBar.open('Device assigned to you', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Failed to assign device', 'Close', { duration: 4000 });
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  unassign(): void {
    if (!this.device) return;
    this.actionLoading = true;

    this.deviceService.unassign(this.device.id).subscribe({
      next: (updated: Device) => {
        this.device = updated;
        this.actionLoading = false;
        this.snackBar.open('Device unassigned', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Failed to unassign device', 'Close', { duration: 4000 });
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  edit(): void {
    if (this.device) {
      this.router.navigate(['/devices', this.device.id, 'edit']);
    }
  }

  back(): void {
    this.router.navigate(['/devices']);
  }
}