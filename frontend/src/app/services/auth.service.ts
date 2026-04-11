import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url        = `${environment.apiUrl}/auth`;
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  }

  getUserId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  getUserName(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('userName') : null;
  }

  getUserRole(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('userRole') : null;
  }

  isEmployee(): boolean { return this.getUserRole() === 'Employee'; }
  isManager():  boolean { return this.getUserRole() === 'Manager'; }
  isAdmin():    boolean { return this.getUserRole() === 'Admin'; }

  canWrite(): boolean {
    const role = this.getUserRole();
    return role === 'Manager' || role === 'Admin';
  }

  canDelete(): boolean { return this.getUserRole() === 'Admin'; }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { this.logout(); return false; }
      return true;
    } catch { return false; }
  }

  private saveSession(res: AuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('token',    res.token);
    localStorage.setItem('userId',   res.userId.toString());
    localStorage.setItem('userName', res.name);
    localStorage.setItem('userRole', res.role);
  }
}