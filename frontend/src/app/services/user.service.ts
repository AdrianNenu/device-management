import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;
  private http = inject(HttpClient);

  getAll(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.url);
  }

  getById(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.url}/${id}`);
  }
}