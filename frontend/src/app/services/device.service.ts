import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, CreateDevice } from '../models/device';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private url = `${environment.apiUrl}/devices`;
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.url);
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.url}/${id}`);
  }

  create(device: CreateDevice): Observable<Device> {
    return this.http.post<Device>(this.url, device, { headers: this.authHeaders() });
  }

  update(id: number, device: CreateDevice): Observable<Device> {
    return this.http.put<Device>(`${this.url}/${id}`, device, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { headers: this.authHeaders() });
  }

  assign(id: number): Observable<Device> {
    return this.http.post<Device>(`${this.url}/${id}/assign`, {}, { headers: this.authHeaders() });
  }

  unassign(id: number): Observable<Device> {
    return this.http.post<Device>(`${this.url}/${id}/unassign`, {}, { headers: this.authHeaders() });
  }

  generateDescription(deviceSpecs: any): Observable<{description: string}> {
    return this.http.post<{description: string}>(`${this.url}/generate-description`, deviceSpecs, { headers: this.authHeaders() });
  }
}