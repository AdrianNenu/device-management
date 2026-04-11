import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeviceStateService {
  private refreshSource = new BehaviorSubject<number>(Date.now());
  refresh$ = this.refreshSource.asObservable();

  triggerRefresh(): void {
    this.refreshSource.next(Date.now());
  }
}