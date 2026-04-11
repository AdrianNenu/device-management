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

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './device-list.html',
  styleUrl: './device-list.scss'
})
export class DeviceListComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  selectedDevice: Device | null = null;
  searchControl = new FormControl('');
  loading = true;
  actionLoading = false;
  activeFilter = 'all';
  toast: Toast | null = null;
  deletingId: number | null = null;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private deviceService = inject(DeviceService);
  private deviceState   = inject(DeviceStateService);
  private auth          = inject(AuthService);
  private router        = inject(Router);
  private cdr           = inject(ChangeDetectorRef);
  private destroy$      = new Subject<void>();

  get userName(): string             { return this.auth.getUserName() ?? 'User'; }
  get userRole(): string             { return this.auth.getUserRole() ?? 'Employee'; }
  get currentUserId(): number | null { return this.auth.getUserId(); }
  get userInitials(): string         { return this.getInitials(this.userName); }
  get canWrite(): boolean            { return this.auth.canWrite(); }
  get canDelete(): boolean           { return this.auth.canDelete(); }

  get assignedCount(): number  { return this.devices.filter(d => d.assignedUserId).length; }
  get availableCount(): number { return this.devices.filter(d => !d.assignedUserId).length; }
  get phoneCount(): number     { return this.devices.filter(d => d.type === 'Phone').length; }
  get tabletCount(): number    { return this.devices.filter(d => d.type === 'Tablet').length; }
  get utilisation(): number    { return this.devices.length ? Math.round(this.assignedCount / this.devices.length * 100) : 0; }

  get filterLabel(): string {
    const labels: Record<string, string> = { all: 'All inventory', assigned: 'Assigned', available: 'Available', Phone: 'Phones', Tablet: 'Tablets' };
    return labels[this.activeFilter] ?? 'All inventory';
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
    const refresh$    = this.deviceState.refresh$.pipe(map(() => this.searchControl.value));

    merge(of(null), userSearch$, refresh$).pipe(
      switchMap((query: string | null) => {
        this.loading = true;
        this.cdr.detectChanges();
        const q = query?.trim() ?? '';
        return q ? this.deviceService.search(q) : this.deviceService.getAll();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: Device[]) => {
        this.devices = data;
        this.applyFilter();
        this.loading = false;
        if (this.selectedDevice) {
          const fresh = this.devices.find(d => d.id === this.selectedDevice!.id);
          this.selectedDevice = fresh ?? null;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  setFilter(f: string): void { this.activeFilter = f; this.applyFilter(); }

  applyFilter(): void {
    let list = [...this.devices];
    if (this.activeFilter === 'assigned')  list = list.filter(d => d.assignedUserId);
    if (this.activeFilter === 'available') list = list.filter(d => !d.assignedUserId);
    if (this.activeFilter === 'Phone')     list = list.filter(d => d.type === 'Phone');
    if (this.activeFilter === 'Tablet')    list = list.filter(d => d.type === 'Tablet');
    this.filteredDevices = list;
  }

  selectDevice(d: Device): void {
    this.deletingId = null;
    this.selectedDevice = this.selectedDevice?.id === d.id ? null : d;
  }

  closePanel(): void { this.selectedDevice = null; this.deletingId = null; }

  newDevice(): void    { this.router.navigate(['/devices/new']); }
  editDevice(id: number): void { this.router.navigate(['/devices', id, 'edit']); }

  // Inline delete confirmation — no confirm() dialog
  promptDelete(id: number): void  { this.deletingId = id; }
  cancelDelete(): void            { this.deletingId = null; }

  confirmDelete(id: number): void {
    this.actionLoading = true;
    this.deviceService.delete(id).subscribe({
      next: () => {
        this.selectedDevice = null;
        this.deletingId = null;
        this.actionLoading = false;
        this.devices         = this.devices.filter(d => d.id !== id);
        this.filteredDevices = this.filteredDevices.filter(d => d.id !== id);
        this.showToast('Device deleted successfully.', 'success');
      },
      error: () => {
        this.actionLoading = false;
        this.showToast('Failed to delete device.');
      }
    });
  }

  assign(id: number): void {
    this.actionLoading = true;
    this.deviceService.assign(id).subscribe({
      next: (updated: Device) => {
        this.selectedDevice = updated;
        this.patchDeviceInPlace(updated);
        this.actionLoading = false;
        this.deviceState.triggerRefresh();
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
        this.patchDeviceInPlace(updated);
        this.actionLoading = false;
        this.deviceState.triggerRefresh();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading = false;
        this.showToast(err.error?.message ?? 'Failed to unassign device.');
      }
    });
  }

  private patchDeviceInPlace(updated: Device): void {
    const patch = (arr: Device[]) => {
      const i = arr.findIndex(d => d.id === updated.id);
      if (i !== -1) arr[i] = updated;
    };
    patch(this.devices);
    patch(this.filteredDevices);
  }

  logout(): void { this.auth.logout(); }
}