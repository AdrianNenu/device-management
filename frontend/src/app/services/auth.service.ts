import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest } from '../models/user';
import { environment } from '../../environments/environment';

export interface SessionInfo {
  name:   string;
  userId: number;
  role:   string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url    = `${environment.apiUrl}/auth`;
  private http   = inject(HttpClient);
  private router = inject(Router);

  // In-memory only — never written to localStorage or sessionStorage.
  private session: SessionInfo | null = null;

  /** Fetch the CSRF token from the server on app startup. */
  initCsrf(): Observable<void> {
    return this.http.get<void>(`${this.url}/csrf`, { withCredentials: true });
  }

  register(data: Omit<RegisterRequest, 'role'>): Observable<SessionInfo> {
    return this.http.post<SessionInfo>(`${this.url}/register`, data, { withCredentials: true }).pipe(
      tap(res => this.session = res)
    );
  }

  login(data: LoginRequest): Observable<SessionInfo> {
    return this.http.post<SessionInfo>(`${this.url}/login`, data, { withCredentials: true }).pipe(
      tap(res => this.session = res)
    );
  }

  logout(): void {
    this.http.post(`${this.url}/logout`, {}, { withCredentials: true }).subscribe();
    this.session = null;
    this.router.navigate(['/login']);
  }

  getUserId(): number | null   { return this.session?.userId ?? null; }
  getUserName(): string | null { return this.session?.name   ?? null; }
  getUserRole(): string | null { return this.session?.role   ?? null; }

  canWrite():  boolean { const r = this.getUserRole(); return r === 'Manager' || r === 'Admin'; }
  canDelete(): boolean { return this.getUserRole() === 'Admin'; }
  isLoggedIn(): boolean { return this.session !== null; }
}