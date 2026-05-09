import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { JwtPayload } from '@models/auth.model';

const TOKEN_KEY = 'cms_token';
const futureExp = Math.floor(Date.now() / 1000) + 3600;
const pastExp   = Math.floor(Date.now() / 1000) - 3600;

function makeToken(payload: Partial<JwtPayload>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('AuthService', () => {
  let httpController: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── login() ──────────────────────────────────────────────────────────

  describe('login(remember=true)', () => {
    it('saves token in localStorage and removes from sessionStorage', () => {
      const service = TestBed.inject(AuthService);
      const token = makeToken({ sub: 1, username: 'admin', role: 'admin', iat: 0, exp: futureExp });

      service.login({ username: 'admin', password: 'pass' }, true).subscribe();

      const req = httpController.expectOne((r) => r.url.includes('/auth/login'));
      req.flush({ token, user: { id: 1, username: 'admin', role: 'admin' } });

      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('login(remember=false)', () => {
    it('saves token in sessionStorage and removes from localStorage', () => {
      const service = TestBed.inject(AuthService);
      const token = makeToken({ sub: 1, username: 'admin', role: 'admin', iat: 0, exp: futureExp });

      service.login({ username: 'admin', password: 'pass' }, false).subscribe();

      const req = httpController.expectOne((r) => r.url.includes('/auth/login'));
      req.flush({ token, user: { id: 1, username: 'admin', role: 'admin' } });

      expect(sessionStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  // ── isAuthenticated() ─────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('returns false when no token is stored', () => {
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true when token is in localStorage', () => {
      localStorage.setItem(TOKEN_KEY, makeToken({ sub: 1, username: 'u', role: 'admin', iat: 0, exp: futureExp }));
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  // ── currentUser() ─────────────────────────────────────────────────

  describe('currentUser()', () => {
    it('returns null when no token is stored', () => {
      const service = TestBed.inject(AuthService);
      expect(service.currentUser()).toBeNull();
    });

    it('decodes the JWT payload correctly', () => {
      const payload: Partial<JwtPayload> = { sub: 42, username: 'tester', role: 'editor', iat: 1000, exp: futureExp };
      localStorage.setItem(TOKEN_KEY, makeToken(payload));
      const service = TestBed.inject(AuthService);
      const user = service.currentUser();
      expect(user?.sub).toBe(42);
      expect(user?.username).toBe('tester');
      expect(user?.role).toBe('editor');
    });
  });

  // ── isTokenExpired() ──────────────────────────────────────────────

  describe('isTokenExpired()', () => {
    it('returns true when no token exists', () => {
      const service = TestBed.inject(AuthService);
      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns true when token exp is in the past', () => {
      localStorage.setItem(TOKEN_KEY, makeToken({ sub: 1, username: 'u', role: 'admin', iat: 0, exp: pastExp }));
      const service = TestBed.inject(AuthService);
      expect(service.isTokenExpired()).toBe(true);
    });

    it('returns false when token exp is in the future', () => {
      localStorage.setItem(TOKEN_KEY, makeToken({ sub: 1, username: 'u', role: 'admin', iat: 0, exp: futureExp }));
      const service = TestBed.inject(AuthService);
      expect(service.isTokenExpired()).toBe(false);
    });
  });

  // ── logout() ──────────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears both storages and navigates to /login', () => {
      const token = makeToken({ sub: 1, username: 'admin', role: 'admin', iat: 0, exp: futureExp });
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_KEY, token);

      const service = TestBed.inject(AuthService);
      const router  = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate');

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
