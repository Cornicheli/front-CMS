import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, JwtPayload } from '@models/auth.model';

const TOKEN_KEY = 'cms_token';
const API_URL = 'http://localhost:3001';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly token = this._token.asReadonly();

  readonly isAuthenticated = computed(() => this._token() !== null);

  readonly currentUser = computed<JwtPayload | null>(() => {
    const token = this._token();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  });

  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this._token.set(response.token);
          localStorage.setItem(TOKEN_KEY, response.token);
        }),
      );
  }

  logout(): void {
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}
