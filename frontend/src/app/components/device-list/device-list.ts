import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Device } from '../../models/device';
import { DeviceService } from '../../services/device.service';
import { DeviceStateService } from '../../services/device-state.service';
import { AuthService } from '../../services/auth.service';

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

  private deviceService = inject(DeviceService);
  private deviceState   = inject(DeviceStateService);
  private auth          = inject(AuthService);
  private router        = inject(Router);
  private cdr           = inject(ChangeDetectorRef);
  private sub           = new Subscription();

  get userName(): string       { return this.auth.getUserName() ?? 'User'; }
  get userRole(): string       { return this.auth.getUserRole() ?? 'Employee'; }
  get currentUserId(): number | null { return this.auth.getUserId(); }
  get userInitials(): string   { return this.getInitials(this.userName); }
  get canWrite(): boolean      { return this.auth.canWrite(); }
  get canDelete(): boolean     { return this.auth.canDelete(); }

  get assignedCount(): number  { return this.devices.filter(d => d.assignedUserId).length; }
  get availableCount(): number { return this.devices.filter(d => !d.assignedUserId).length; }
  get phoneCount(): number     { return this.devices.filter(d => d.type === 'Phone').length; }
  get tabletCount(): number    { return this.devices.filter(d => d.type === 'Tablet').length; }
  get utilisation(): number    { return this.devices.length ? Math.round(this.assignedCount / this.devices.length * 100) : 0; }

  get filterLabel(): string {
    const map: Record<string, string> = { all: 'All inventory', assigned: 'Assigned', available: 'Available', Phone: 'Phones', Tablet: 'Tablets' };
    return map[this.activeFilter] ?? 'All inventory';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  canUnassign(device: Device): boolean {
    if (!device.assignedUserId) return false;
    if (this.auth.canWrite()) return true;
    return device.assignedUserId === this.currentUserId;
  }

  ngOnInit(): void {
    this.sub.add(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query: string | null) => {
          this.loading = true;
          this.cdr.detectChanges();
          return query ? this.deviceService.search(query) : this.deviceService.getAll();
        })
      ).subscribe({
        next: (data: Device[]) => {
          this.devices = data;
          this.applyFilter();
          this.loading = false;
          if (this.selectedDevice) {
            this.selectedDevice = this.devices.find(d => d.id === this.selectedDevice!.id) ?? null;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      })
    );

    this.sub.add(
      this.deviceState.refresh$.subscribe(() => {
        this.searchControl.setValue(this.searchControl.value);
      })
    );
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

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
    this.selectedDevice = this.selectedDevice?.id === d.id ? null : d;
  }

  closePanel(): void { this.selectedDevice = null; }

  newDevice(): void { this.router.navigate(['/devices/new']); }

  editDevice(id: number): void { this.router.navigate(['/devices', id, 'edit']); }

  deleteDevice(id: number): void {
    if (!confirm('Delete this device?')) return;
    this.actionLoading = true;
    this.deviceService.delete(id).subscribe({
      next: () => {
        this.selectedDevice = null;
        this.actionLoading = false;
        this.deviceState.triggerRefresh();
      },
      error: () => { this.actionLoading = false; this.cdr.detectChanges(); }
    });
  }

  assign(id: number): void {
    this.actionLoading = true;
    this.deviceService.assign(id).subscribe({
      next: (updated: Device) => {
        this.selectedDevice = updated;
        this.actionLoading = false;
        this.deviceState.triggerRefresh();
      },
      error: (err: HttpErrorResponse) => {
        alert(err.error?.message ?? 'Failed to assign');
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  unassign(id: number): void {
    this.actionLoading = true;
    this.deviceService.unassign(id).subscribe({
      next: (updated: Device) => {
        this.selectedDevice = updated;
        this.actionLoading = false;
        this.deviceState.triggerRefresh();
      },
      error: (err: HttpErrorResponse) => {
        alert(err.error?.message ?? 'Failed to unassign');
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void { this.auth.logout(); }
}