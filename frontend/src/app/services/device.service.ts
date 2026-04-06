import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, CreateDevice } from '../models/device';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private url = `${environment.apiUrl}/devices`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.url);
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.url}/${id}`);
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
}