import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { Device } from '../models/device';

// Central state store for the device list.
// DeviceListComponent reads from here; it no longer manages its own arrays.
@Injectable({ providedIn: 'root' })
export class DeviceStateService {
  private readonly _devices   = signal<Device[]>([]);
  private readonly _loading   = signal<boolean>(true);
  private readonly _filter    = signal<string>('all');
  private readonly _search    = signal<string>('');

  readonly devices   = this._devices.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly filter    = this._filter.asReadonly();

  readonly filteredDevices = computed(() => {
    const f = this._filter();
    return this._devices().filter(d => {
      if (f === 'assigned')  return !!d.assignedUserId;
      if (f === 'available') return !d.assignedUserId;
      if (f === 'Phone')     return d.type === 'Phone';
      if (f === 'Tablet')    return d.type === 'Tablet';
      return true;
    });
  });

  readonly assignedCount  = computed(() => this._devices().filter(d => d.assignedUserId).length);
  readonly availableCount = computed(() => this._devices().filter(d => !d.assignedUserId).length);
  readonly phoneCount     = computed(() => this._devices().filter(d => d.type === 'Phone').length);
  readonly tabletCount    = computed(() => this._devices().filter(d => d.type === 'Tablet').length);
  readonly utilisation    = computed(() =>
    this._devices().length
      ? Math.round(this.assignedCount() / this._devices().length * 100)
      : 0);

  private refreshSource = new Subject<void>();
  readonly refresh$ = this.refreshSource.asObservable();

  setDevices(devices: Device[]): void { this._devices.set(devices); }
  setLoading(v: boolean): void         { this._loading.set(v); }
  setFilter(f: string): void            { this._filter.set(f); }

  patchDevice(updated: Device): void {
    this._devices.update(list =>
      list.map(d => d.id === updated.id ? updated : d)
    );
  }

  removeDevice(id: number): void {
    this._devices.update(list => list.filter(d => d.id !== id));
  }

  triggerRefresh(): void { this.refreshSource.next(); }
}