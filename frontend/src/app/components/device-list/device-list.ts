import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, merge, of, debounceTime, distinctUntilChanged, switchMap, map, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../components/icon/icon.component';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './device-list.html',
  styleUrl: './device-list.scss'
})
export class DeviceListComponent implements OnInit, OnDestroy {
  selectedDevice: Device | null = null;
  searchControl = new FormControl('');
  actionLoading = false;
  toast: Toast | null = null;
  deletingId: number | null = null;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private deviceService = inject(DeviceService);
  readonly state        = inject(DeviceStateService);
  private auth          = inject(AuthService);
  private router        = inject(Router);
  private cdr           = inject(ChangeDetectorRef);
  private destroy$      = new Subject<void>();

  get userName(): string  { return this.auth.getUserName() ?? 'User'; }
  get userRole(): string  { return this.auth.getUserRole() ?? 'Employee'; }
  get userInitials(): string { return this.getInitials(this.userName); }
  get canWrite(): boolean { return this.auth.canWrite(); }
  get canDelete(): boolean{ return this.auth.canDelete(); }

  get currentUserId(): number | null { return this.auth.getUserId(); }

  get filterLabel(): string {
    const labels: Record<string, string> = {
      all: 'All inventory', assigned: 'Assigned',
      available: 'Available', Phone: 'Phones', Tablet: 'Tablets'
    };
    return labels[this.state.filter()] ?? 'All inventory';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  canUnassign(device: Device): boolean {
    if (!device.assignedUserId) return false;
    if (this.auth.canWrite()) return true;
    return device.assignedUserId === this.currentUserId;
  }

  private showToast(message: string, type: Toast['type'] = 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => { this.toast = null; this.cdr.detectChanges(); }, 4000);
  }

  ngOnInit(): void {
    const userSearch$ = this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged());
    const refresh$    = this.state.refresh$.pipe(map(() => this.searchControl.value));

    merge(of(null), userSearch$, refresh$).pipe(
      switchMap((query: string | null) => {
        this.state.setLoading(true);
        const q = query?.trim() ?? '';
        return q ? this.deviceService.search(q) : this.deviceService.getAll();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: Device[]) => {
        this.state.setDevices(data);
        this.state.setLoading(false);
        if (this.selectedDevice) {
          const fresh = data.find(d => d.id === this.selectedDevice!.id);
          this.selectedDevice = fresh ?? null;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.state.setLoading(false); this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  setFilter(f: string): void   { this.state.setFilter(f); }
  selectDevice(d: Device): void { this.selectedDevice = this.selectedDevice?.id === d.id ? null : d; }
  closePanel(): void            { this.selectedDevice = null; this.deletingId = null; }
  newDevice(): void             { this.router.navigate(['/devices/new']); }
  editDevice(id: number): void  { this.router.navigate(['/devices', id, 'edit']); }

  promptDelete(id: number): void { this.deletingId = id; }
  cancelDelete(): void           { this.deletingId = null; }

  confirmDelete(id: number): void {
    this.actionLoading = true;
    this.deviceService.delete(id).subscribe({
      next: () => {
        this.selectedDevice = null;
        this.deletingId     = null;
        this.actionLoading  = false;
        this.state.removeDevice(id);
        this.showToast('Device deleted successfully.', 'success');
      },
      error: () => { this.actionLoading = false; this.showToast('Failed to delete device.'); }
    });
  }

  assign(id: number): void {
    this.actionLoading = true;
    this.deviceService.assign(id).subscribe({
      next: (updated: Device) => {
        this.selectedDevice = updated;
        this.state.patchDevice(updated);
        this.actionLoading = false;
        this.state.triggerRefresh();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading = false;
        this.showToast(err.error?.message ?? 'Failed to assign device.');
      }
    });
  }

  unassign(id: number): void {
    this.actionLoading = true;
    this.deviceService.unassign(id).subscribe({
      next: (updated: Device) => {
        this.selectedDevice = updated;
        this.state.patchDevice(updated);
        this.actionLoading = false;
        this.state.triggerRefresh();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading = false;
        this.showToast(err.error?.message ?? 'Failed to unassign device.');
      }
    });
  }

  logout(): void { this.auth.logout(); }
}