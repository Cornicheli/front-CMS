import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, JwtPayload } from '@models/auth.model';
import { API_BASE_URL } from '@core/constants/api.constants';

const TOKEN_KEY = 'cms_token';

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(readToken());

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

  login(credentials: LoginRequest, remember = false) {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this._token.set(response.token);
          if (remember) {
            localStorage.setItem(TOKEN_KEY, response.token);
            sessionStorage.removeItem(TOKEN_KEY);
          } else {
            sessionStorage.setItem(TOKEN_KEY, response.token);
            localStorage.removeItem(TOKEN_KEY);
          }
        }),
      );
  }

  logout(): void {
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}
