import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ContentService } from '@features/contents/services/content.service';
import { ZONES, getZoneForContent, getMetrics } from '@models/zone.model';
import { MonitorSidebarComponent } from './monitor-sidebar/monitor-sidebar.component';
import { MonitorMapComponent } from './monitor-map/monitor-map.component';
import { MonitorGridComponent } from './monitor-grid/monitor-grid.component';
import { MonitorScreenService } from './monitor-screen.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [MonitorSidebarComponent, MonitorMapComponent, MonitorGridComponent, RouterLink],
  templateUrl: './monitor.component.html',
})
export class MonitorComponent {
  protected readonly contentService = inject(ContentService);
  protected readonly screenService = inject(MonitorScreenService);
  protected readonly themeService = inject(ThemeService);

  readonly zones = ZONES;

  readonly activeZoneId   = signal<string | null>(null);
  readonly activeFolderId = signal<number | null>(null);
  readonly viewMode       = signal<'grid' | 'list'>('grid');

  /** Contents shown in the grid: non-archived + zone/folder filters */
  readonly filteredContents = computed(() => {
    let items = this.contentService.contents().filter(c => !c.archived);

    const zoneId = this.activeZoneId();
    if (zoneId) {
      items = items.filter(c => getZoneForContent(c.id) === zoneId);
    }

    const folderId = this.activeFolderId();
    if (folderId) {
      items = items.filter(c => c.folder_id === folderId);
    }

    return items;
  });

  readonly kpiNetworkHealth = computed(() => `${this.screenService.networkHealth()}%`);

  readonly breadcrumb = computed(() => {
    const zoneId = this.activeZoneId();
    const folderId = this.activeFolderId();
    if (zoneId) {
      const zone = this.zones.find(z => z.id === zoneId);
      return zone ? `/ ${zone.name}` : '';
    }
    if (folderId) {
      const folder = this.contentService.folders().find(f => f.id === folderId);
      return folder ? `/ ${folder.name}` : '';
    }
    return '/ Todas las zonas';
  });

  /** Active plays — non-archived AND online contents across the network */
  readonly kpiActivePlays = computed(() =>
    this.contentService.contents().filter(
      c => !c.archived && !this.screenService.isContentOffline(c.id)
    ).length
  );

  /** Revenue — only online contents in current filter view */
  readonly kpiRevenue = computed(() => {
    const total = this.filteredContents()
      .filter(c => !this.screenService.isContentOffline(c.id))
      .reduce((acc, c) => acc + getMetrics(c.id).revenue, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total}`;
  });

  /** Reach — only online contents in current filter view */
  readonly kpiReach = computed(() => {
    const total = this.filteredContents()
      .filter(c => !this.screenService.isContentOffline(c.id))
      .reduce((acc, c) => acc + getMetrics(c.id).reach, 0);
    return total >= 1000 ? `${Math.round(total / 1000)}K` : `${total}`;
  });

  /** Error / disconnected screen count */
  readonly kpiErrors = computed(() => this.screenService.alertCount());

  /** 24h timeline bar chart data */
  readonly timeline24h = computed(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const plays = hours.map(h =>
      30 + Math.round(Math.sin((h / 24) * Math.PI * 2 - 1) * 20 + ((h * 7) % 9))
    );
    const max = Math.max(...plays);
    const now = new Date().getHours();
    return hours.map(h => ({
      h,
      pct: (plays[h] / max) * 68,
      trigPct: ((h * 3) % 7 > 4) ? (plays[h] / max) * 28 : 0,
      isNow: h === now,
    }));
  });

  readonly liveTime = signal(new Date().toTimeString().slice(0, 8));

  readonly smartTriggers = [
    { icon: '☂', name: 'Lluvia',     sub: 'rain > 0.5mm',  color: '#67e8f9', on: true,  hits: 14 },
    { icon: '⏱', name: 'Hora pico',  sub: '18:00 — 21:00', color: '#fbbf24', on: true,  hits: 42 },
    { icon: '☀', name: 'Calor',      sub: 'temp > 32°',    color: '#f87171', on: true,  hits: 8  },
    { icon: '⚽', name: 'Match local',sub: 'event.match',   color: '#a78bfa', on: false, hits: 0  },
  ];

  readonly popActivity = [
    { t: '03:31:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'partial' },
    { t: '03:31:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:30:33', screen: 'RET-002',  zone: 'Retiro',    content: 'Campaña Retiro',    dur: 30, status: 'ok' },
    { t: '03:30:05', screen: 'CABA-009', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:29:33', screen: 'PAL-003',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:29:05', screen: 'PM-001',   zone: 'P. Madero', content: 'Coca Cola Mundial', dur: 30, status: 'ok' },
    { t: '03:28:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:28:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Banner tecno',      dur: 15, status: 'ok' },
    { t: '03:27:33', screen: 'TEL-002',  zone: 'San Telmo', content: 'Menu Digital',      dur: 30, status: 'partial' },
    { t: '03:27:05', screen: 'CABA-009', zone: 'Centro',    content: 'Coca Cola',         dur: 10, status: 'ok' },
  ];

  constructor() {
    if (this.contentService.contents().length === 0) {
      this.contentService.loadMockData().pipe(takeUntilDestroyed()).subscribe();
    }
    setInterval(() => this.liveTime.set(new Date().toTimeString().slice(0, 8)), 1000);
  }

  onZoneSelected(id: string | null): void {
    this.activeZoneId.set(id);
    this.activeFolderId.set(null);
  }

  onFolderSelected(id: number | null): void {
    this.activeFolderId.set(id);
    this.activeZoneId.set(null);
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  activeZoneName(): string {
    const id = this.activeZoneId();
    if (!id) return '';
    return this.zones.find(z => z.id === id)?.name ?? '';
  }
}
