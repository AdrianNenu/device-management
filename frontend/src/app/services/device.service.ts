import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, CreateDevice } from '../models/device';
import { environment } from '../../environments/environment';

export interface GenerateDescriptionRequest {
  name: string;
  manufacturer: string;
  type: string;
  os: string;
  osVersion: string;
  processor: string;
  ram: number;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private url = `${environment.apiUrl}/devices`;
  private http = inject(HttpClient);

  getAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.url);
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.url}/${id}`);
  }

  search(query: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.url}/search?q=${encodeURIComponent(query)}`);
  }

  create(device: CreateDevice): Observable<Device> {
    return this.http.post<Device>(this.url, device);
  }

  update(id: number, device: CreateDevice): Observable<Device> {
    return this.http.put<Device>(`${this.url}/${id}`, device);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  assign(id: number): Observable<Device> {
    return this.http.post<Device>(`${this.url}/${id}/assign`, {});
  }

  unassign(id: number): Observable<Device> {
    return this.http.post<Device>(`${this.url}/${id}/unassign`, {});
  }

  generateDescription(specs: GenerateDescriptionRequest): Observable<{ description: string }> {
    return this.http.post<{ description: string }>(`${this.url}/generate-description`, specs);
  }
}