import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '@core/constants/api.constants';

export type ScreenStatus = 'live' | 'idle' | 'disconnected';

export interface Screen {
  id: number;
  name: string;
  zoneId: string;
  status: ScreenStatus;
  lastSeen: Date;
}

const now = Date.now();

const INITIAL_SCREENS: Screen[] = [
  // Centro — 8 screens
  { id: 1,  name: 'Centro-01', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 30000) },
  { id: 2,  name: 'Centro-02', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 60000) },
  { id: 3,  name: 'Centro-03', zoneId: 'centro',        status: 'idle',         lastSeen: new Date(now - 120000) },
  { id: 4,  name: 'Centro-04', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 45000) },
  { id: 5,  name: 'Centro-05', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 90000) },
  { id: 6,  name: 'Centro-06', zoneId: 'centro',        status: 'idle',         lastSeen: new Date(now - 180000) },
  { id: 7,  name: 'Centro-07', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 15000) },
  { id: 8,  name: 'Centro-08', zoneId: 'centro',        status: 'live',         lastSeen: new Date(now - 75000) },
  // Palermo — 5 screens
  { id: 9,  name: 'Palermo-01', zoneId: 'palermo',      status: 'live',         lastSeen: new Date(now - 20000) },
  { id: 10, name: 'Palermo-02', zoneId: 'palermo',      status: 'live',         lastSeen: new Date(now - 50000) },
  { id: 11, name: 'Palermo-03', zoneId: 'palermo',      status: 'idle',         lastSeen: new Date(now - 150000) },
  { id: 12, name: 'Palermo-04', zoneId: 'palermo',      status: 'live',         lastSeen: new Date(now - 35000) },
  { id: 13, name: 'Palermo-05', zoneId: 'palermo',      status: 'live',         lastSeen: new Date(now - 100000) },
  // Retiro — 3 screens
  { id: 14, name: 'Retiro-01',  zoneId: 'retiro',       status: 'live',         lastSeen: new Date(now - 25000) },
  { id: 15, name: 'Retiro-02',  zoneId: 'retiro',       status: 'idle',         lastSeen: new Date(now - 200000) },
  { id: 16, name: 'Retiro-03',  zoneId: 'retiro',       status: 'disconnected', lastSeen: new Date(now - 400000) },
  // Puerto Madero — 4 screens
  { id: 17, name: 'PMadero-01', zoneId: 'puerto-madero', status: 'live',        lastSeen: new Date(now - 10000) },
  { id: 18, name: 'PMadero-02', zoneId: 'puerto-madero', status: 'live',        lastSeen: new Date(now - 55000) },
  { id: 19, name: 'PMadero-03', zoneId: 'puerto-madero', status: 'idle',        lastSeen: new Date(now - 160000) },
  { id: 20, name: 'PMadero-04', zoneId: 'puerto-madero', status: 'live',        lastSeen: new Date(now - 40000) },
  // San Telmo — 2 screens
  { id: 21, name: 'STelmo-01',  zoneId: 'san-telmo',    status: 'live',         lastSeen: new Date(now - 65000) },
  { id: 22, name: 'STelmo-02',  zoneId: 'san-telmo',    status: 'disconnected', lastSeen: new Date(now - 500000) },
];

@Injectable({ providedIn: 'root' })
export class MonitorScreenService {
  private readonly http = inject(HttpClient);

  // Per-content online/offline status (separate from physical screen status)
  private readonly _offlineContents = signal<Set<number>>(new Set());
  readonly offlineContents = this._offlineContents.asReadonly();

  isContentOffline(contentId: number): boolean {
    return this._offlineContents().has(contentId);
  }

  setContentStatus(contentId: number, status: 'online' | 'offline'): void {
    // Optimistic update
    this._offlineContents.update(set => {
      const next = new Set(set);
      if (status === 'offline') next.add(contentId);
      else next.delete(contentId);
      return next;
    });
    // Persist to backend
    this.http.patch(`${API_URL}/contents/${contentId}/screen-status`, { screen_status: status }).subscribe();
  }

  private readonly _screens = signal<Screen[]>(INITIAL_SCREENS);

  readonly screens = this._screens.asReadonly();

  readonly liveCount = computed(() =>
    this._screens().filter(s => s.status === 'live').length
  );

  readonly disconnectedCount = computed(() =>
    this._screens().filter(s => s.status === 'disconnected').length
  );

  readonly criticalCount = computed(() => {
    const threshold = 5 * 60 * 1000;
    return this._screens().filter(
      s => s.status !== 'live' || Date.now() - s.lastSeen.getTime() > threshold
    ).length;
  });

  readonly networkHealth = computed(() => {
    const total = this._screens().length;
    if (total === 0) return 100;
    return Math.round((this.liveCount() / total) * 100);
  });

  readonly alertCount = computed(() =>
    this.disconnectedCount() + (this.criticalCount() > this.disconnectedCount() ? 1 : 0)
  );

  changeStatus(id: number, status: ScreenStatus): void {
    const prev = this._screens().find(s => s.id === id);
    if (!prev) return;
    this._screens.update(screens =>
      screens.map(s => s.id === id ? { ...s, status, lastSeen: new Date() } : s)
    );
  }

  screensByZone(zoneId: string): Screen[] {
    return this._screens().filter(s => s.zoneId === zoneId);
  }

  worstZoneStatus(zoneId: string): ScreenStatus {
    const zone = this.screensByZone(zoneId);
    if (zone.some(s => s.status === 'disconnected')) return 'disconnected';
    if (zone.some(s => s.status === 'idle')) return 'idle';
    return 'live';
  }
}
