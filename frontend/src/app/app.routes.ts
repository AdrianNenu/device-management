import { Routes } from '@angular/router';
import { DeviceListComponent } from './components/device-list/device-list';
import { DeviceDetailComponent } from './components/device-detail/device-detail';
import { DeviceFormComponent } from './components/device-form/device-form';

export const routes: Routes = [
  { path: '', redirectTo: 'devices', pathMatch: 'full' },
  { path: 'devices', component: DeviceListComponent },
  { path: 'devices/new', component: DeviceFormComponent },
  { path: 'devices/:id/edit', component: DeviceFormComponent },
  { path: 'devices/:id', component: DeviceDetailComponent }
];